import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const facilityLabels = { water: "Drinking water", toilets: "Toilets", electricity: "Electricity", first_aid: "First aid", sleeping: "Sleeping space", other: "Other facilities" };

export default function AdminShelters() {
  const { t, language } = useLanguage();
  const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [actionPending, setActionPending] = useState(false);
  const [notice, setNotice] = useState("");
  const actionRef = useRef(null);
  const busyRef = useRef(false);
  useEffect(() => () => actionRef.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/shelters?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        if (!response.ok) throw new Error(response.status === 401 ? "Please sign in with your administrator account." : response.status === 403 ? "This page is available to administrators only." : "Unable to load requests. Please try again.");
        const body = await response.json();
        if (!controller.signal.aborted) setData(body);
      } catch (error) {
        if (!controller.signal.aborted) setMessage(["Please sign in with your administrator account.", "This page is available to administrators only."].includes(error.message) ? error.message : "Unable to load requests. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [page, retry]);

  async function act(shelter, action) {
    if (busyRef.current) return;
    if (action === "delete" && !window.confirm(`${t("Delete this shelter permanently?")}\n${shelter.name}`)) return;
    busyRef.current = true;
    setActionPending(true);
    setMessage("");
    setNotice("");
    const controller = new AbortController();
    actionRef.current = controller;
    try {
      const response = await fetch(`/api/admin/shelters/${shelter.id}${action === "approve" ? "/approve" : ""}`, {
        method: action === "approve" ? "POST" : "DELETE", headers: { "X-CSRF-Protection": "1" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setMessage(response.status === 401 ? "Please sign in with your administrator account." : response.status === 403 ? "This page is available to administrators only." : "The shelter may have changed. Refresh the list and try again.");
        return;
      }
      setNotice(action === "approve" ? "Shelter approved. It is now visible on public pages." : "Shelter deleted.");
      setData(null); setLoading(true); setRetry((value) => value + 1);
    } catch {
      if (!controller.signal.aborted) setMessage("Connection interrupted. Refresh the list to check the shelter status.");
    } finally {
      busyRef.current = false;
      if (!controller.signal.aborted) setActionPending(false);
    }
  }

  return <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-8 min-[761px]:px-6">
    <a href="/admin" className="font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Admin dashboard")}</a>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">{t("Pending shelters")}</h1>
      <button type="button" disabled={loading || actionPending} onClick={() => { setLoading(true); setData(null); setMessage(""); setRetry((value) => value + 1); }} className="rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t("Refresh list")}</button>
    </div>
    {notice && <p role="status" className="mb-4 rounded-xl border border-[#73aaa3] p-4">{t(notice)}</p>}
    {loading && <p role="status">{t("Loading shelters…")}</p>}
    {message && <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {data && <>
      {!data.shelters.length && <p className="rounded-xl border border-[#73aaa3] p-6">{t("No shelters are waiting for review.")}</p>}
      <ul className="grid list-none gap-4 p-0">{data.shelters.map((shelter) => <li key={shelter.id} className="rounded-2xl border border-[#73aaa3] bg-[#e1efea] p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{shelter.name}</h2><span className="rounded-full bg-[#f4d5bd] px-3 py-1 text-sm text-[#773f14]">{t("Pending review")}</span></div>
        <p className="mt-2">{shelter.nearestTown}</p>
        <p className="mt-2 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(shelter.createdAt))}</p>
        <details className="mt-3"><summary className="cursor-pointer rounded py-2 font-bold text-[#007e8d] focus-visible:outline-2 dark:text-[#99e4c9]">{t("View details")}</summary>
          <dl className="mt-3 grid gap-4 min-[761px]:grid-cols-2">{[["Shelter address", shelter.address], ["Phone number", shelter.phone], ["Total capacity", shelter.capacity], ["Current occupancy", shelter.occupied], ["Available spaces", shelter.capacity - shelter.occupied], ["Available facilities", shelter.facilities.map((value) => t(facilityLabels[value] || value)).join(", ") || "—"], ...(shelter.otherFacilities ? [["Describe other facilities", shelter.otherFacilities]] : [])].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 whitespace-pre-wrap wrap-break-word leading-7">{value}</dd></div>)}</dl>
          <p className="mt-4 break-all text-xs">{t("Shelter reference")}: {shelter.id}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" disabled={actionPending} onClick={() => act(shelter, "approve")} className="rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white disabled:opacity-50">{t("Approve shelter")}</button>
            <button type="button" disabled={actionPending} onClick={() => act(shelter, "delete")} className="rounded-lg border border-red-400 bg-red-50 px-4 py-2 font-bold text-red-800 disabled:opacity-50">{t("Delete shelter")}</button>
          </div>
        </details>
      </li>)}</ul>
      <nav aria-label={t("Shelter pages")} className="mt-6 flex gap-5">{page > 1 && <a href={`/admin/shelters?page=${page - 1}`}>{t("Previous")}</a>}{data.hasMore && <a href={`/admin/shelters?page=${page + 1}`}>{t("Next")}</a>}</nav>
    </>}
  </main>;
}
