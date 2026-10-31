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

  return <section id="recent-contributions" className="mt-12 scroll-mt-6 overflow-hidden rounded-[28px] border border-[#83b9b2] bg-[#edf6f2] shadow-[0_12px_32px_rgb(15_64_82/6%)] dark:border-[#416f68] dark:bg-[#102f34]" aria-labelledby="recent-contributions-title">
    <div className="grid gap-6 border-b border-[#b0cec5] p-6 min-[761px]:grid-cols-[1fr_auto] min-[761px]:items-center min-[761px]:p-9 dark:border-[#315850]">
      <div><p className="mb-3 text-xs font-bold tracking-[.14em] text-[#007667] uppercase dark:text-[#99e4c9]">01 · {t("Our community of givers")}</p><h2 id="recent-contributions-title" className="text-[clamp(24px,3vw,32px)] leading-snug font-bold">{t("People making a difference")}</h2><p className="mt-3 max-w-2xl text-sm leading-7">{t("Thank you to everyone supporting our communities. Here are the latest approved contributions.")}</p></div>
      <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#cce6db] text-4xl text-[#007667] dark:bg-[#224d43] dark:text-[#99e4c9]">♡</span>
    </div>
    <div className="p-6 min-[761px]:p-9">
    {error ? <div role="alert" className="rounded-xl border border-[#73aaa3] p-5"><p>{t("Unable to load contributions. Please try again.")}</p><button type="button" onClick={() => { setError(false); setContributions(null); setRetry((value) => value + 1); }} className="mt-3 rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold">{t("Refresh list")}</button></div> : !contributions ? <p role="status">{t("Loading contributions…")}</p> : !contributions.length ? <div className="grid items-center gap-7 rounded-2xl bg-[#d8ebe2] p-6 min-[761px]:grid-cols-[auto_1fr] min-[761px]:p-8 dark:bg-[#1b423b]">
      <div aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full border border-[#8ebdaf] bg-[#eef8f1] dark:border-[#4d8172] dark:bg-[#12372f]"><svg className="h-12 w-12 text-[#007667] dark:text-[#99e4c9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11Z" /></svg></div>
      <div><h3 className="text-2xl font-bold">{t("Every act of kindness starts something.")}</h3><p className="mt-3 max-w-xl leading-7">{t("Approved contributions will appear here. Your support could help a family take their next step.")}</p><a href="#funder-form" className="mt-5 inline-flex items-center gap-5 rounded-xl bg-[#007667] px-5 py-3 font-bold text-white hover:bg-[#005e53]">{t("Make a contribution")} <span aria-hidden="true">→</span></a></div>
    </div> : <ul className="grid list-none gap-5 p-0 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-3">
      {contributions.map((contribution) => <li key={contribution.id} className="rounded-2xl border border-[#b0cec5] bg-white p-6 shadow-sm dark:border-[#416f68] dark:bg-[#1b423b]">
        <div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a8d5c5] text-lg font-bold text-[#005849]">{Array.from(contribution.name.trim())[0]}</span><div className="min-w-0"><h3 className="wrap-break-word text-lg font-bold">{contribution.name}</h3><p className="mt-1 text-sm">{contribution.nearestTown}</p></div></div>
        {contribution.amountMinor !== undefined && <p className="mt-5 text-2xl font-bold text-[#00685b] dark:text-[#99e4c9]">{new Intl.NumberFormat(language === "si" ? "si-LK" : "en-LK", { style: "currency", currency: "LKR" }).format(contribution.amountMinor / 100)}</p>}
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">{contribution.supportTypes.map((type) => <li key={type} className="rounded-full bg-white/70 px-3 py-1 text-sm dark:bg-[#12382f]">{t(supportLabels[type] || type)}</li>)}</ul>
        <p className="mt-5 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeZone: "Asia/Colombo" }).format(new Date(contribution.createdAt))}</p>
      </li>)}
    </ul>}
    </div>
  </section>;
}
