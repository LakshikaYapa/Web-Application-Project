import { useLanguage } from "../i18n/useLanguage";

export default function AuthIntro() {
  const { t } = useLanguage();
  return (
    <aside className="auth-intro">
      <div className="auth-intro-brand"><img src="/floodguard-logo.png" alt="" width="42" height="48" /><span>FloodGuard</span></div>
      <div className="auth-intro-message">
        <span className="auth-eyebrow">{t("Together, we make a difference")}</span>
        <h2>{t("A helping hand. A stronger community.")}</h2>
        <p>{t("Connect with people who care. Find support, volunteer your time or help fund relief efforts.")}</p>
        <div className="auth-values"><span>{t("Support")}</span><span>{t("Connect")}</span><span>{t("Rebuild")}</span></div>
      </div>
      <p className="auth-intro-footer">{t("A safer Sri Lanka, together.")}</p>
    </aside>
  );
}
