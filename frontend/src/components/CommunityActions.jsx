import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
export default function CommunityActions() {
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function load() {
      try {
        const response = await fetch("/api/contributions/summary", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Number.isSafeInteger(body.totalMinor) || body.totalMinor < 0) throw new Error("Invalid summary");
        if (!controller.signal.aborted) { setSummary(body); setError(false); }
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) timer = setTimeout(load, 30000); }
    }
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  return (
    <div className="community-actions" aria-label={t("Ways to support communities")}>
      <section className="community-action-card volunteer-action" aria-labelledby="volunteer-action-title">
        <span className="community-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="3" />
            <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" />
          </svg>
        </span>
        <div className="community-action-content">
          <h2 id="volunteer-action-title">{t("Volunteer")}</h2>
          <p>{t("Join local relief efforts and make a difference in your community.")}</p>
          <a className="community-action-link" href="/volunteer#volunteer-form">{t("Join the team")}<span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="community-action-card relief-action" aria-labelledby="relief-action-title">
        <span className="community-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M12 21 3.5 12.5C-2 6.5 6 0 12 6c6-6 14 .5 8.5 6.5L12 21Z" />
          </svg>
        </span>
        <div className="community-action-content">
          <div className="relief-title-row"><h2 id="relief-action-title">{t("Fund relief efforts")}</h2></div>
          <p>{t("Support affected families and help communities recover.")}</p>
          <div className="my-4 rounded-xl border border-pink-200 bg-white/70 p-4 dark:border-pink-900 dark:bg-black/15" aria-live="polite">
            <p className="text-sm">{t("Total financial donations")}</p>
            {error ? <p role="alert">{t("Unable to load donation total. Please try again later.")}</p> : summary ? <>
              <p className="mt-2 text-2xl font-bold">{new Intl.NumberFormat(language === "si" ? "si-LK" : "en-LK", { style: "currency", currency: "LKR" }).format(summary.totalMinor / 100)}</p>
              <p className="mt-2 text-sm">{t("Donations")}: {summary.donationCount}</p>
            </> : <p role="status">{t("Loading donation total...")}</p>}
          </div>
          <a className="community-action-link" href="/funder">{t("Support relief efforts")}<span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  );
}
