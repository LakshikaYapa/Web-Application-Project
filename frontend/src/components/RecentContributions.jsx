import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const supportLabels = { financial: "Financial support", food_water: "Food and drinking water", shelter: "Shelter essentials", relief: "Relief operations", other: "Other support" };

export default function RecentContributions() {
  const { t, language } = useLanguage();
  const [contributions, setContributions] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/contributions", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.contributions)) throw new Error("Unable to load contributions");
        if (!controller.signal.aborted) setContributions(body.contributions);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    load();
    return () => controller.abort();
  }, [retry]);

  return <section className="mt-10" aria-labelledby="recent-contributions-title">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="recent-contributions-title" className="text-[28px] font-bold">{t("People making a difference")}</h2><p className="mt-2 leading-7">{t("Thank you to everyone supporting our communities. Here are the latest approved contributions.")}</p></div>
      <a href="#funder-form" className="rounded-lg bg-[#007667] px-5 py-3 font-bold text-white hover:bg-[#005e53]">{t("Make a contribution")} ↓</a>
    </div>
    {error ? <div role="alert" className="mt-5 rounded-xl border border-[#73aaa3] p-5"><p>{t("Unable to load contributions. Please try again.")}</p><button type="button" onClick={() => { setError(false); setContributions(null); setRetry((value) => value + 1); }} className="mt-3 rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold">{t("Refresh list")}</button></div> : !contributions ? <p role="status" className="mt-5">{t("Loading contributions…")}</p> : !contributions.length ? <p className="mt-5 rounded-xl border border-[#73aaa3] bg-[#d4eae3] p-5 dark:bg-[#1c443e]">{t("Be part of our next contribution. Use the form below to offer your support.")}</p> : <ul className="mt-6 grid list-none gap-5 p-0 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-3">
      {contributions.map((contribution) => <li key={contribution.id} className="rounded-2xl border border-[#73aaa3] bg-[#d4eae3] p-6 shadow-sm dark:border-[#578e83] dark:bg-[#1c443e]">
        <div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a8d5c5] text-lg font-bold text-[#005849]">{Array.from(contribution.name.trim())[0]}</span><div className="min-w-0"><h3 className="wrap-break-word text-lg font-bold">{contribution.name}</h3><p className="mt-1 text-sm">{contribution.nearestTown}</p></div></div>
        {contribution.amountMinor !== undefined && <p className="mt-5 text-2xl font-bold text-[#00685b] dark:text-[#99e4c9]">{new Intl.NumberFormat(language === "si" ? "si-LK" : "en-LK", { style: "currency", currency: "LKR" }).format(contribution.amountMinor / 100)}</p>}
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">{contribution.supportTypes.map((type) => <li key={type} className="rounded-full bg-white/70 px-3 py-1 text-sm dark:bg-[#12382f]">{t(supportLabels[type] || type)}</li>)}</ul>
        <p className="mt-5 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeZone: "Asia/Colombo" }).format(new Date(contribution.createdAt))}</p>
      </li>)}
    </ul>}
  </section>;
}
