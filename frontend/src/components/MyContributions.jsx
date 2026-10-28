import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const supportLabels = { financial: "Financial support", food_water: "Food and drinking water", shelter: "Shelter essentials", relief: "Relief operations", other: "Other support" };
const linkClass = "font-semibold text-[#007667] hover:underline dark:text-[#99e4c9]";

export default function MyContributions() {
  const { t, language } = useLanguage();
  const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/contributions/mine?page=${page}`, {
      credentials: "same-origin", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
    }).then(async (response) => {
      if (response.status === 401) throw new Error("Please sign in using the page header, then refresh this list.");
      if (!response.ok) throw new Error("Unable to load your contributions. Please try again.");
      const body = await response.json();
      if (!body.success || !Array.isArray(body.contributions)) throw new Error("Unable to load your contributions. Please try again.");
      if (!controller.signal.aborted) setResult(body);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message === "Please sign in using the page header, then refresh this list." ? failure.message : "Unable to load your contributions. Please try again.");
    });
    return () => controller.abort();
  }, [page]);

  const locale = language === "si" ? "si-LK" : "en-LK";
  return <main id="main" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12" tabIndex={-1}>
    <a className={linkClass} href="/funder">← {t("Back to funder page")}</a>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">{t("My contributions")}</h1>
      <button type="button" className="cursor-pointer rounded-lg border border-[#73aaa3] px-4 py-2 text-sm font-semibold hover:bg-[#d4eae3] dark:hover:bg-[#1c443e]" onClick={() => window.location.reload()}>{t("Refresh list")}</button>
    </div>
    <p className="mt-3 leading-relaxed">{t("Your contributions, newest first.")}</p>
    {error ? <p className="mt-6 rounded-xl border border-red-400 bg-red-50 p-5 text-red-900" role="alert">{t(error)}</p> : !result ? <p className="mt-6" role="status">{t("Loading your contributions…")}</p> : <>
      {!result.contributions.length && <p className="mt-6 rounded-xl border border-[#73aaa3] p-5" role="status">{t(page === 1 ? "You have not submitted any contributions yet." : "No contributions on this page.")}</p>}
      <ul className="mt-6 grid list-none gap-5 p-0">{result.contributions.map((contribution) => <li key={contribution.id} className="min-w-0 rounded-2xl border border-[#73aaa3] bg-[#e1f0e9] p-5 sm:p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{t("Contribution reference")}: <span className="break-all font-mono text-sm font-normal">{contribution.id}</span></h2>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">{t(contribution.status === "pending_review" ? "Pending review" : contribution.status)}</span>
        </div>
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">{contribution.supportTypes.map((type) => <li key={type} className="rounded-lg bg-[#c1dfd1] px-3 py-1.5 text-sm dark:bg-[#315f4e]">{t(supportLabels[type] || type)}</li>)}</ul>
        {Number.isSafeInteger(contribution.amountMinor) && <p className="mt-4 text-2xl font-bold text-[#005849] dark:text-[#b4f3d5]">{new Intl.NumberFormat(locale, { style: "currency", currency: "LKR" }).format(contribution.amountMinor / 100)}</p>}
        <p className="mt-4"><strong>{t("Nearest town")}:</strong> {contribution.nearestTown}</p>
        {contribution.otherSupport && <p className="mt-3 whitespace-pre-wrap wrap-anywhere"><strong>{t("Other support")}:</strong> {contribution.otherSupport}</p>}
        {contribution.notes && <p className="mt-3 whitespace-pre-wrap wrap-anywhere">{contribution.notes}</p>}
        <p className="mt-4 text-sm">{t("Sent on")}: <time dateTime={contribution.createdAt}>{new Date(contribution.createdAt).toLocaleString(locale, { timeZone: "Asia/Colombo" })}</time></p>
      </li>)}</ul>
      <nav className="mt-6 flex justify-between gap-4" aria-label={t("Contribution list pages")}>
        {page > 1 && <a className={linkClass} href={`/my-contributions?page=${page - 1}`}>{t("Previous page")}</a>}
        {result.hasMore && <a className={`${linkClass} ml-auto`} href={`/my-contributions?page=${page + 1}`}>{t("Next page")}</a>}
      </nav>
    </>}
  </main>;
}
