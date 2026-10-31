import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import ApprovedHelpRequests from "./ApprovedHelpRequests";

const helpTypes = ["Food and drinking water", "Shelter", "Rescue or transport", "Medical assistance", "Other help"];

function PhotoPreview({ file }) {
  const imageRef = useRef(null);
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    imageRef.current.src = preview;
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return <img ref={imageRef} alt={file.name} />;
}

export default function HelpRequestPage() {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [helpType, setHelpType] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(null);
  const pendingRef = useRef(false);
  const requestRef = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (message || saved) feedbackRef.current?.focus();
  }, [message, saved]);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(["helpType", "phone", "nearestTown", "location", "description"].map((field) => [field, String(form.get(field) || "").trim()]));
    if (payload.helpType === "Other help") payload.otherHelp = String(form.get("otherHelp") || "").trim();
    if (Object.values(payload).some((value) => !value)) {
      setMessage("Please complete all required fields.");
      return;
    }
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(payload.phone.replace(/[\s()-]/g, ""))) {
      setMessage("Enter a valid Sri Lankan phone number.");
      return;
    }
    const upload = new FormData();
    for (const [field, value] of Object.entries(payload)) upload.append(field, value);
    for (const photo of photos) upload.append("photos", photo);
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/help-requests", {
        method: "POST", credentials: "same-origin",
        headers: { "X-CSRF-Protection": "1" },
        body: upload,
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 201 && body.success && body.request?.id) {
        setSaved(body.request);
      } else {
        const messages = {
          400: "Please check your request details and try again.",
          401: "Please use Sign in at the top of this page, then send your request again.",
          403: "Unable to send your request. Reload this page and try again.",
          413: "Photos are too large. Use up to 3 images, maximum 5 MB each.",
          429: "Too many requests. Please try again later.",
        };
        setMessage(body.code === "INVALID_PHOTOS" ? "Use JPG, PNG or WebP images, up to 5 MB each." : (messages[response.status] || "Unable to save your request. Please try again."));
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Connection interrupted. Your request may have been saved. Please check before sending again.");
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function selectPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (photos.length + files.length > 3) {
      setError("Choose up to 3 photos.");
      return;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError("Use JPG, PNG or WebP images, up to 5 MB each.");
      return;
    }
    setError("");
    setPhotos((current) => [...current, ...files]);
  }

  return (
    <main id="main" className="help-request-page" tabIndex={-1}>
      <a className="help-back" href="/">← {t("Back to homepage")}</a>
      <h1>{t("Request help")}</h1>
      <a className="help-back" href="/my-requests">{t("My help requests")}</a>
      <p>{t("Tell us what support you need and where you are.")}</p>
      <nav aria-label={t("Help page sections")} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#79b5af] p-3 font-semibold"><a href="#approved-help-requests" className="rounded-lg px-4 py-3 hover:bg-[#cce6db] dark:hover:bg-[#224d43]">{t("Approved help requests")}</a><a href="#submit-help-request" className="rounded-lg px-4 py-3 hover:bg-[#cce6db] dark:hover:bg-[#224d43]">{t("Request help")}</a></nav>
      <ApprovedHelpRequests />
      <section id="submit-help-request" className="scroll-mt-6" aria-labelledby="new-help-title">
      <h2 id="new-help-title" className="mb-4 text-2xl font-bold">{t("Send a new help request")}</h2>
      {saved ? <section className="help-preview-note" role="status" ref={feedbackRef} tabIndex={-1}>
        <h2>{t("Help request saved")}</h2>
        <p>{t("Your request is pending. This does not confirm that help has been dispatched.")}</p>
        <p>{t("Request reference")}: {saved.id}</p>
        <p>{t("Photos saved")}: {saved.photoCount ?? 0}</p>
        <a href="/">{t("Back to homepage")}</a>
      </section> : <form onSubmit={submit} aria-busy={pending}>
      {message && <p className="help-preview-note" role="alert" ref={feedbackRef} tabIndex={-1}>{t(message)}</p>}
      <fieldset className="help-request-form" disabled={pending}>
        <legend className="sr-only">{t("Request help")}</legend>
        <label htmlFor="help-type">{t("What help do you need?")}</label>
        <select id="help-type" name="helpType" required value={helpType} onChange={(event) => setHelpType(event.target.value)}>
          <option value="" disabled>{t("Select a help type")}</option>
          {helpTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}
        </select>
        {helpType === "Other help" && <>
          <label htmlFor="help-other">{t("What other help do you need?")}</label>
          <input id="help-other" name="otherHelp" type="text" required maxLength={200} />
        </>}
        <label htmlFor="help-phone">{t("Phone number")}</label>
        <input id="help-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} aria-describedby="help-phone-hint" />
        <p className="help-photo-hint" id="help-phone-hint">{t("Use 077 123 4567 or +94 77 123 4567.")}</p>
        <label htmlFor="help-town">{t("Nearest town")}</label>
        <input id="help-town" name="nearestTown" autoComplete="address-level2" required maxLength={100} />
        <label htmlFor="help-location">{t("Location or nearby landmark")}</label>
        <input id="help-location" name="location" required maxLength={300} />
        <label htmlFor="help-details">{t("Describe your situation")}</label>
        <textarea id="help-details" name="description" rows={5} required maxLength={2000} />
        <label htmlFor="help-photos">{t("Photos (optional)")}</label>
        <p className="help-photo-hint" id="help-photo-hint">{t("Up to 3 photos. JPG, PNG or WebP, maximum 5 MB each.")}</p>
        <input id="help-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectPhotos} aria-describedby="help-photo-hint help-photo-error" />
        <p id="help-photo-error" role="alert">{error && t(error)}</p>
        {photos.length > 0 && <ul className="help-photo-list">
          {photos.map((file, index) => <li key={`${file.name}-${index}`}>
            <PhotoPreview file={file} /><span>{file.name}</span>
            <button type="button" aria-label={`${t("Remove photo")}: ${file.name}`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}>{t("Remove photo")}</button>
          </li>)}
        </ul>}
        <button className="register-submit" type="submit" disabled={pending}>{t(pending ? "Sending request…" : "Send request")}</button>
      </fieldset>
      </form>}
      </section>
    </main>
  );
}
