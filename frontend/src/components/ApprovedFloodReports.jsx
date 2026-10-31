import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const situations = { road: "Flooded road", homes: "Flooded homes", rising_water: "Rising water", other: "Other situation" };

export default function ApprovedFloodReports() {
  const { t, language } = useLanguage();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/flood-reports?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.reports)) throw new Error("Unable to load reports");
        if (!controller.signal.aborted) setData(body);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    load();
    return () => controller.abort();
  }, [page, retry]);

  function changePage(value) { setData(null); setError(false); setPage(value); }

  return <section id="approved-flood-reports" className="mt-12 scroll-mt-6 rounded-[28px] border border-[#79b5af] bg-[#edf6f4] p-6 min-[761px]:p-9 dark:border-[#4b817b] dark:bg-[#102f34]" aria-labelledby="approved-reports-title">
    <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="mb-3 text-xs font-bold tracking-widest text-[#007e8d] uppercase dark:text-[#99e4c9]">{t("Community updates")}</p><h2 id="approved-reports-title" className="text-3xl font-bold">{t("Flood reports")}</h2><p className="mt-3 max-w-2xl text-sm leading-7">{t("Reports reviewed by our team. Check the reported date, as local conditions may have changed.")}</p></div>
      <button type="button" onClick={() => { setData(null); setError(false); setRetry((value) => value + 1); }} className="rounded-xl border border-[#73aaa3] px-4 py-3 font-semibold hover:bg-[#cce6db] dark:hover:bg-[#224d43]">{t("Refresh list")}</button>
    </div>
    {error ? <p role="alert" className="mt-6">{t("Unable to load flood reports. Please refresh the list.")}</p> : !data ? <p role="status" className="mt-6">{t("Loading flood reports…")}</p> : <>
      {!data.reports.length && <div className="mt-6 rounded-2xl border border-[#9cc6bc] bg-[#d8ebe2] p-6 dark:border-[#416f68] dark:bg-[#1b423b]"><h3 className="text-xl font-bold">{t("No approved flood reports yet.")}</h3><p className="mt-3 leading-7">{t("You can share what you see using the report form below.")}</p><a href="#submit-flood-report" className="mt-4 inline-block rounded-lg bg-[#007e8d] px-4 py-3 font-bold text-white">{t("Report a flood")} →</a></div>}
      <ul className="mt-6 grid list-none gap-5 p-0 min-[761px]:grid-cols-2">{data.reports.map((report) => <li key={report.id} className="min-w-0 rounded-2xl border border-[#9cc6bc] border-t-4 border-t-[#238c87] bg-white p-6 shadow-sm dark:border-[#416f68] dark:border-t-[#80c7b3] dark:bg-[#1b423b]">
        <div className="flex flex-wrap justify-between gap-3"><h3 className="wrap-break-word text-xl font-bold">{report.nearestTown}</h3></div>
        <p className="mt-3 text-sm leading-7">{report.location}</p>
        <p className="mt-2 text-sm">{t("Reported on")}: {new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(report.createdAt))}</p>
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">{report.situations.map((value) => <li key={value} className="rounded-full bg-[#d8ebe2] px-3 py-1 text-sm dark:bg-[#12343d]">{t(situations[value] || value)}</li>)}</ul>
        {report.otherSituation && <p className="mt-4 whitespace-pre-wrap wrap-break-word leading-7">{report.otherSituation}</p>}
        <p className="mt-4 whitespace-pre-wrap wrap-break-word leading-7">{report.description}</p>
        {report.photoCount > 0 && <div className="mt-5 flex flex-wrap gap-3">{Array.from({ length: report.photoCount }, (_, index) => <a key={index} href={`/api/flood-reports/${report.id}/photos/${index}`} target="_blank" rel="noopener noreferrer" className="rounded-lg focus-visible:outline-2"><img src={`/api/flood-reports/${report.id}/photos/${index}`} loading="lazy" alt={`${t("Report photo")} ${index + 1}`} className="h-28 w-32 rounded-lg border border-[#73aaa3] object-cover" /></a>)}</div>}
      </li>)}</ul>
      {(page > 1 || data.hasMore) && <nav aria-label={t("Flood report pages")} className="mt-6 flex items-center gap-4"><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} className="rounded-lg border border-[#73aaa3] px-4 py-2 disabled:opacity-40">{t("Previous")}</button><span>{t("Page")} {page}</span><button type="button" disabled={!data.hasMore} onClick={() => changePage(page + 1)} className="rounded-lg border border-[#73aaa3] px-4 py-2 disabled:opacity-40">{t("Next")}</button></nav>}
    </>}
  </section>;
}
