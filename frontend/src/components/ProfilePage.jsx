import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

function PhotoPreview({ file, name }) {
  const ref = useRef(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={name} className="h-36 w-36 rounded-full object-cover" />;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const saveRef = useRef(null);
  const busyRef = useRef(false);
  useEffect(() => () => saveRef.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(response.status === 401 ? "Please sign in to view your profile." : "Unable to load your profile. Please try again.");
        if (!controller.signal.aborted) setUser(body.user);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message === "Please sign in to view your profile." ? failure.message : "Unable to load your profile. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [retry]);
  function refresh() { setLoading(true); setError(""); setUser(null); setPhoto(null); setRetry(value => value + 1); }
  function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) { setPhotoError("Choose a JPG, PNG or WebP photo, up to 5 MB."); return; }
    setPhoto(file); setPhotoError("");
  }
  async function savePhoto(remove = false) {
    if (busyRef.current) return;
    busyRef.current = true; setSaving(true); setNotice(""); setPhotoError("");
    const controller = new AbortController(); saveRef.current = controller;
    try {
      const body = new FormData();
      if (!remove) body.append("photo", photo);
      const response = await fetch("/api/profile/photo", { method: remove ? "DELETE" : "PUT", headers: { "X-CSRF-Protection": "1" }, ...(remove ? {} : { body }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error("Photo save failed");
      if (!controller.signal.aborted) {
        setUser(current => ({ ...current, photoUrl: remove ? null : result.photoUrl }));
        setPhoto(null); setNotice(remove ? "Profile photo removed." : "Profile photo saved.");
      }
    } catch { if (!controller.signal.aborted) setPhotoError("Unable to update your photo. Please try again."); }
    finally { busyRef.current = false; if (!controller.signal.aborted) setSaving(false); }
  }
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join("").toLocaleUpperCase();
  const roles = { volunteer: "Volunteer", funder: "Donator", help_seeker: "Community member", admin: "Administrator" };
  return <main id="main" tabIndex={-1} className="mx-auto w-full max-w-4xl px-5 py-10">
    <a href="/" className="font-semibold text-[#007e8d] dark:text-[#99e4c9]">&larr; {t("Back to homepage")}</a>
    <header className="my-6"><h1 className="text-3xl font-bold">{t("My profile")}</h1><p className="mt-3 leading-7">{t("Your FloodGuard account and profile photo.")}</p></header>
    {loading ? <p role="status">{t("Loading profile...")}</p> : error ? <div role="alert" className="rounded-2xl border border-[#73aaa3] p-6"><p>{t(error)}</p><button onClick={refresh} className="mt-4 rounded-lg border border-[#73aaa3] px-4 py-2">{t("Try again")}</button></div> : user && <section className="grid gap-8 rounded-3xl border border-[#79b5af] bg-[#edf6f4] p-6 sm:grid-cols-[220px_1fr] sm:p-9 dark:bg-[#102f34]">
      <div className="flex flex-col items-center gap-4">
        {photo ? <PhotoPreview file={photo} name={t("Profile photo preview")} /> : user.photoUrl ? <img src={user.photoUrl} alt={user.name} className="h-36 w-36 rounded-full object-cover" /> : <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#bee1d8] text-4xl font-bold text-[#153e50]">{initials}</div>}
        <label className="w-full text-sm font-bold" htmlFor="profile-photo">{t("Profile photo (optional)")}</label>
        <input id="profile-photo" disabled={saving} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} aria-describedby="profile-photo-hint profile-photo-error" className="w-full text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[#007e8d] file:px-3 file:py-2 file:text-white" />
        <p id="profile-photo-hint" className="text-sm leading-6">{t("Choose a JPG, PNG or WebP photo, up to 5 MB.")}</p>
        {photo && <button disabled={saving} onClick={() => { setPhoto(null); setPhotoError(""); }} className="text-sm font-semibold underline">{t("Remove photo")}</button>}
        {photo && <button disabled={saving} onClick={() => savePhoto()} className="rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t(saving ? "Saving photo..." : "Save photo")}</button>}
        {user.photoUrl && !photo && <button disabled={saving} onClick={() => savePhoto(true)} className="text-sm font-bold underline disabled:opacity-50">{t("Remove saved photo")}</button>}
        {notice && <p role="status" className="text-sm">{t(notice)}</p>}
        <p id="profile-photo-error" role="alert" className="text-sm text-red-700 dark:text-red-200">{photoError && t(photoError)}</p>
      </div>
      <div><h2 className="break-words text-2xl font-bold">{user.name}</h2><dl className="mt-6 space-y-6"><div><dt className="text-sm font-bold">{t("Email address")}</dt><dd className="mt-2 break-all">{user.email}</dd></div><div><dt className="text-sm font-bold">{t("Account roles")}</dt><dd className="mt-3 flex flex-wrap gap-2">{user.roles.map(role => <span key={role} className="rounded-full bg-[#cce6db] px-3 py-1 text-sm font-semibold text-[#005849]">{t(roles[role] || role)}</span>)}</dd></div></dl>
        <p className="mt-8 rounded-xl border border-[#79b5af] p-4 text-sm leading-7">{t("Your photo will appear on your volunteer or donor card when your participation is approved.")}</p>
      </div>
    </section>}
  </main>;
}
