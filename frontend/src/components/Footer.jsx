import { useLanguage } from "../i18n/useLanguage";
export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <a className="footer-brand" href="#page-top" aria-label={t("FloodGuard, back to top")}>
          <img src="/floodguard-logo.png" alt="" width="42" height="48" loading="lazy" />
          <span><strong>FloodGuard</strong><span>{t("A safer Sri Lanka, together.")}</span></span>
        </a>
        <p className="footer-message">{t("Stay informed. Find help. Help others.")}</p>
        <a className="back-to-top" href="#page-top">{t("Back to top")}<span aria-hidden="true">↑</span></a>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} FloodGuard</p>
        <p>{t("Built for stronger communities.")}</p>
      </div>
    </footer>
  );
}
