import { useLanguage } from "../i18n/useLanguage";
export default function CommunityActions() {
  const { t } = useLanguage();
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
          <button type="button" disabled aria-describedby="volunteer-coming-soon">{t("Join the team")}<span aria-hidden="true">→</span></button>
          <span className="action-coming-soon" id="volunteer-coming-soon">{t("Volunteer registration coming soon")}</span>
        </div>
      </section>

      <section className="community-action-card relief-action" aria-labelledby="relief-action-title">
        <span className="community-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M12 21 3.5 12.5C-2 6.5 6 0 12 6c6-6 14 .5 8.5 6.5L12 21Z" />
          </svg>
        </span>
        <div className="community-action-content">
          <div className="relief-title-row"><h2 id="relief-action-title">{t("Fund relief efforts")}</h2><span className="demo-badge">{t("Demo")}</span></div>
          <p>{t("Support affected families and help communities recover.")}</p>
          <div className="relief-progress" role="progressbar" aria-label={t("Demo fundraising progress")} aria-valuenow={47} aria-valuemin={0} aria-valuemax={100} aria-valuetext={t("Demo: 47 percent of LKR 5,000,000 goal")}>
            <span />
          </div>
          <div className="relief-total"><span><strong>{t("LKR 2,350,000")}</strong>{" "}{t("raised (demo)")}</span><strong>47%</strong></div>
          <p className="relief-demo-note">{t("Sample figures, not actual donations.")}</p>
          <button type="button" disabled aria-describedby="donations-coming-soon">{t("Support relief efforts")}<span aria-hidden="true">→</span></button>
          <span className="action-coming-soon" id="donations-coming-soon">{t("Donations coming soon")}</span>
        </div>
      </section>
    </div>
  );
}
