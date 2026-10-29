import { useLanguage } from "../i18n/useLanguage";
import { useEffect, useState } from "react";
import RegisterDialog from "./RegisterDialog";
import SignInDialog from "./SignInDialog";

const navigation = [
  { label: "Flood map", target: "flood-map-title" },
  { label: "Shelters", target: "shelters-title", page: "/shelters" },
  { label: "Volunteer", target: "volunteers-title", page: "/volunteer" },
  { label: "Donate", target: "relief-action-title", page: "/funder" },
];

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
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
        <a className="brand" href="/" aria-label={t("FloodGuard home")}>
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
          <a href="/" aria-current={window.location.pathname === "/" ? "page" : undefined} onClick={() => setMenuOpen(false)}>{t("Home")}</a>
          {navigation.map(({ label, target, page }) => (
            <a key={target} href={page || `/#${target}`} aria-current={page && window.location.pathname.replace(/\/$/, "") === page ? "page" : undefined} onClick={() => setMenuOpen(false)}>
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
        <button className="sign-in-button" type="button" onClick={() => { setMenuOpen(false); setAuthMode("signin"); }}>{t("Sign in")}</button>
      </div>
      {authMode === "signin" && <SignInDialog onClose={() => setAuthMode(null)} onRegister={() => setAuthMode("register")} />}
      {authMode === "register" && <RegisterDialog onClose={() => setAuthMode(null)} onSignIn={() => setAuthMode("signin")} />}
    </header>
  );
}
