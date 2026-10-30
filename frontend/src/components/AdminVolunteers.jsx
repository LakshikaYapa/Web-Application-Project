import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const areaLabels = { relief: "Relief distribution", transport: "Transport support", community: "Community support", other: "Other help" };
const statusLabels = { pending: "New registration", joined: "Joined", ignored: "Ignored" };

export default function AdminVolunteers() {
  const { t, language } = useLanguage();
  const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [actionPending, setActionPending] = useState(false);
  const actionRef = useRef(null);
  const busyRef = useRef(false);
  useEffect(() => () => actionRef.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/volunteers?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        if (!response.ok) throw new Error(response.status === 401 ? "Please sign in with your administrator account." : response.status === 403 ? "This page is available to administrators only." : "Unable to load volunteers. Please try again.");
        const body = await response.json();
        if (!controller.signal.aborted) setData(body);
      } catch (error) {
        if (!controller.signal.aborted) setMessage(["Please sign in with your administrator account.", "This page is available to administrators only."].includes(error.message) ? error.message : "Unable to load volunteers. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [page, retry]);

  async function act(volunteer, action) {
    if (busyRef.current) return;
    busyRef.current = true; setActionPending(true); setMessage(""); setNotice("");
    const controller = new AbortController();
    actionRef.current = controller;
    try {
      const response = await fetch(`/api/admin/volunteers/${volunteer.id}/${action}`, { method: "POST", headers: { "X-CSRF-Protection": "1" }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setMessage(response.status === 401 ? "Please sign in with your administrator account." : response.status === 403 ? "This page is available to administrators only." : "The volunteer may have changed. Refresh the list and try again.");
        return;
      }
      setNotice(action === "join" ? "Volunteer joined the team." : "Volunteer registration ignored.");
      setLoading(true); setData(null); setRetry((value) => value + 1);
    } catch {
      if (!controller.signal.aborted) setMessage("Connection interrupted. Refresh the list to check the volunteer status.");
    } finally {
      busyRef.current = false;
      if (!controller.signal.aborted) setActionPending(false);
    }
  }

  return <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-8 min-[761px]:px-6">
    <a href="/admin" className="font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Admin dashboard")}</a>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">{t("Volunteers")}</h1><p className="mt-2">{t("New registrations and existing volunteers are listed together.")}</p></div>
      <button type="button" disabled={loading || actionPending} onClick={() => { setLoading(true); setData(null); setMessage(""); setRetry((value) => value + 1); }} className="rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t("Refresh list")}</button>
    </div>
    {loading && <p role="status">{t("Loading volunteers…")}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl border border-[#73aaa3] p-4">{t(notice)}</p>}
    {message && <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {data && <>
      {!data.volunteers.length && <p className="rounded-xl border border-[#73aaa3] p-6">{t("No volunteer registrations yet.")}</p>}
      <ul className="grid list-none gap-4 p-0">{data.volunteers.map((volunteer) => <li key={volunteer.id} className="rounded-2xl border border-[#73aaa3] bg-[#e1efea] p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{volunteer.name || t("Volunteer")}</h2><span className={`rounded-full px-3 py-1 text-sm font-semibold ${volunteer.status === "joined" ? "bg-[#a8d5c5] text-[#005849]" : "bg-[#f4d5bd] text-[#773f14]"}`}>{t(statusLabels[volunteer.status])}</span></div>
        <p className="mt-2">{volunteer.nearestTown}</p>
        <p className="mt-2 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(volunteer.createdAt))}</p>
        <details className="mt-3"><summary className="cursor-pointer rounded py-2 font-bold text-[#007e8d] focus-visible:outline-2 dark:text-[#99e4c9]">{t("View details")}</summary>
          <dl className="mt-3 grid gap-4 min-[761px]:grid-cols-2">{[["Nearest town", volunteer.nearestTown], ["Email address", volunteer.email || "—"], ["Phone number", volunteer.phone || "—"]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 wrap-break-word leading-7">{value}</dd></div>)}</dl>
          <div className="mt-5 grid gap-4 min-[761px]:grid-cols-2">{volunteer.supportAreas.map((area) => <section key={area.area} className="rounded-xl border border-[#73aaa3] p-4"><h3 className="font-bold">{t(areaLabels[area.area] || area.area)}</h3>
            {area.otherSupport && <p className="mt-2 whitespace-pre-wrap wrap-break-word">{area.otherSupport}</p>}
            <ul className="mt-2 list-inside list-disc space-y-1">{area.skills.map((skill) => <li key={skill}>{t(skill)}</li>)}</ul>
            {area.otherSkills && <p className="mt-3 whitespace-pre-wrap wrap-break-word">{area.otherSkills}</p>}
          </section>)}</div>
          {volunteer.status === "pending" && <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={actionPending} onClick={() => act(volunteer, "join")} className="rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white disabled:opacity-50">{t("Join team")}</button><button type="button" disabled={actionPending} onClick={() => act(volunteer, "ignore")} className="rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold disabled:opacity-50">{t("Ignore")}</button></div>}
        </details>
      </li>)}</ul>
      <nav aria-label={t("Volunteer pages")} className="mt-6 flex gap-5">{page > 1 && <a href={`/admin/volunteers?page=${page - 1}`}>{t("Previous")}</a>}{data.hasMore && <a href={`/admin/volunteers?page=${page + 1}`}>{t("Next")}</a>}</nav>
    </>}
  </main>;
}
