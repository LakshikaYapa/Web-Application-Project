import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const supportLabels = { financial: "Financial support", food_water: "Food and drinking water", shelter: "Shelter essentials", relief: "Relief operations", other: "Other support" };

export default function AdminContributions() {
  const { t, language } = useLanguage();
  const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/contributions?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
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
      <h1 className="text-3xl font-bold">{t("Contributions")}</h1>
      <button type="button" disabled={loading} onClick={() => { setLoading(true); setData(null); setMessage(""); setRetry((value) => value + 1); }} className="rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t("Refresh list")}</button>
    </div>
    {loading && <p role="status">{t("Loading contributions…")}</p>}
    {message && <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {data && <>
      {!data.contributions.length && <p className="rounded-xl border border-[#73aaa3] p-6">{t("No contributions are waiting for review.")}</p>}
      <ul className="grid list-none gap-4 p-0">{data.contributions.map((contribution) => <li key={contribution.id} className="rounded-2xl border border-[#73aaa3] bg-[#e1efea] p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{contribution.nearestTown}</h2><span className="rounded-full bg-[#f4d5bd] px-3 py-1 text-sm text-[#773f14]">{t("Pending review")}</span></div>
        <p className="mt-2">{contribution.supportTypes.map((value) => t(supportLabels[value] || value)).join(", ")}</p>
        <p className="mt-2 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(contribution.createdAt))}</p>
        <details className="mt-3"><summary className="cursor-pointer rounded py-2 font-bold text-[#007e8d] focus-visible:outline-2 dark:text-[#99e4c9]">{t("View details")}</summary>
          <dl className="mt-3 grid gap-4 min-[761px]:grid-cols-2">{[["Nearest town", contribution.nearestTown], ["Phone number", contribution.phone], ...(contribution.amountMinor !== undefined ? [["Donated amount", new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(contribution.amountMinor / 100)]] : []), ...(contribution.otherSupport ? [["Other support", contribution.otherSupport]] : []), ...(contribution.notes ? [["Contribution details (optional)", contribution.notes]] : [])].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 whitespace-pre-wrap wrap-break-word leading-7">{value}</dd></div>)}</dl>
          {contribution.hasReceipt && <div className="mt-5 flex flex-wrap gap-3">
            <a href={`/api/admin/contributions/${contribution.id}/receipt`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white">{t("View receipt")}</a>
            <a href={`/api/admin/contributions/${contribution.id}/receipt?download=1`} className="rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold">{t("Download receipt")}</a>
          </div>}
          <p className="mt-4 break-all text-xs">{t("Contribution reference")}: {contribution.id}</p>
        </details>
      </li>)}</ul>
      <nav aria-label={t("Contribution pages")} className="mt-6 flex gap-5">{page > 1 && <a href={`/admin/contributions?page=${page - 1}`}>{t("Previous")}</a>}{data.hasMore && <a href={`/admin/contributions?page=${page + 1}`}>{t("Next")}</a>}</nav>
    </>}
  </main>;
}
