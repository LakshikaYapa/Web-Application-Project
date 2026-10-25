import { useLanguage } from "../i18n/useLanguage";
import { useEffect, useState } from "react";
import RegisterDialog from "./RegisterDialog";

const navigation = [
  { label: "Flood map", target: "flood-map-title" },
  { label: "Shelters", target: "shelters-title" },
  { label: "Volunteer", target: "volunteers-title" },
  { label: "Donate", target: "relief-action-title" },
];

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("floodguard-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* Use the system preference when storage is unavailable. */ }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("floodguard-theme", theme);
    } catch { /* Theme switching still works without persistent storage. */ }
  }, [theme]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#main" aria-label={t("FloodGuard home")}>
          <img src="/floodguard-logo.png" alt="" width="48" height="56" />
          <span>FloodGuard</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? t("Close menu") : t("Menu")}
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>

        <nav
          id="primary-navigation"
          className={`primary-navigation${menuOpen ? " is-open" : ""}`}
          aria-label={t("Main navigation")}
        >
          <a href="#main" aria-current="page" onClick={() => setMenuOpen(false)}>{t("Home")}</a>
          {navigation.map(({ label, target }) => (
            <a key={target} href={`#${target}`} onClick={() => setMenuOpen(false)}>
              {t(label)}
            </a>
          ))}
        </nav>

        <div className="language-switch" role="group" aria-label="Language / භාෂාව">
          <button type="button" lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
          <button type="button" lang="si" aria-pressed={language === "si"} onClick={() => setLanguage("si")}>සිංහල</button>
        </div>
        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? t("Switch to light mode") : t("Switch to dark mode")}
          aria-pressed={theme === "dark"}
          onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <button className="register-open-button" type="button" onClick={() => { setMenuOpen(false); setRegisterOpen(true); }}>{t("Register")}</button>
        <button className="sign-in-button" type="button" disabled title={t("Coming soon")}>{t("Sign in")}<span className="sr-only">{t("— coming soon")}</span>
        </button>
      </div>
      {registerOpen && <RegisterDialog onClose={() => setRegisterOpen(false)} />}
    </header>
  );
}
