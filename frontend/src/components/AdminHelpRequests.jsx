import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { adminHelpExamples } from "./adminHelpExamples";

export default function AdminHelpRequests() {
  const { t, language } = useLanguage();
  const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const requests = [...(data?.requests || []), ...(!data?.hasMore ? adminHelpExamples : [])];

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/help-requests?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
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

  return <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-8 min-[761px]:px-6">
    <a href="/admin" className="font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Admin dashboard")}</a>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">{t("Help requests")}</h1>
      <button type="button" disabled={loading} onClick={() => { setLoading(true); setData(null); setMessage(""); setRetry((value) => value + 1); }} className="rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t("Refresh list")}</button>
    </div>
    {loading && <p role="status">{t("Loading requests…")}</p>}
    {message && <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {data && <>
      <ul className="grid list-none gap-4 p-0">{requests.map((request) => <li key={request.id} className="rounded-2xl border border-[#73aaa3] bg-[#e1efea] p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{t(request.helpType)}</h2><span className="rounded-full bg-[#f4d5bd] px-3 py-1 text-sm text-[#773f14]">{t("Pending review")}</span></div>
        <p className="mt-2">{request.nearestTown}</p>
        <p className="mt-2 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(request.createdAt))}</p>
        <details className="mt-3"><summary className="cursor-pointer rounded py-2 font-bold text-[#007e8d] focus-visible:outline-2 dark:text-[#99e4c9]">{t("View details")}</summary>
          <dl className="mt-3 grid gap-4 min-[761px]:grid-cols-2">{[["Nearest town", request.nearestTown], ["Location or nearby landmark", request.location], ["Phone number", request.phone], ...(request.otherHelp ? [["Other help", request.otherHelp]] : []), ["Description", request.description]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 whitespace-pre-wrap wrap-break-word leading-7">{request.id.startsWith("preview-") ? t(value) : value}</dd></div>)}</dl>
          {request.photoCount > 0 && <div className="mt-5 flex flex-wrap gap-3">{Array.from({ length: request.photoCount }, (_, index) => <a key={index} href={`/api/admin/help-requests/${request.id}/photos/${index}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg focus-visible:outline-2"><img src={`/api/admin/help-requests/${request.id}/photos/${index}`} loading="lazy" alt={`${t("Request photo")} ${index + 1}`} className="h-32 w-40 rounded-lg border border-[#73aaa3] object-cover" /></a>)}</div>}
          <p className="mt-4 break-all text-xs">{t("Request reference")}: {request.id}</p>
        </details>
      </li>)}</ul>
      <nav aria-label={t("Help request pages")} className="mt-6 flex gap-5">{page > 1 && <a href={`/admin/help-requests?page=${page - 1}`}>{t("Previous")}</a>}{data.hasMore && <a href={`/admin/help-requests?page=${page + 1}`}>{t("Next")}</a>}</nav>
    </>}
  </main>;
}
