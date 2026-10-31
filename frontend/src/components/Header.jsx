import { useLanguage } from "../i18n/useLanguage";
import { useEffect, useRef, useState } from "react";
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
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const logoutRef = useRef(null);
  const logoutBusy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!controller.signal.aborted && response.ok && body.success) setUser(body.user);
      } catch { /* Sign-in remains available if the session check fails. */ }
      finally { if (!controller.signal.aborted) setCheckingSession(false); }
    }
    checkSession();
    return () => { controller.abort(); logoutRef.current?.abort(); };
  }, []);

  async function logout() {
    if (logoutBusy.current) return;
    logoutBusy.current = true;
    setSigningOut(true);
    setLogoutError(false);
    const controller = new AbortController();
    logoutRef.current = controller;
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST", credentials: "same-origin", headers: { "X-CSRF-Protection": "1" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      if (!response.ok) throw new Error("Logout failed");
      window.location.assign("/");
    } catch {
      if (!controller.signal.aborted) setLogoutError(true);
    } finally {
      logoutBusy.current = false;
      if (!controller.signal.aborted) setSigningOut(false);
    }
  }
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
        {user ? <div className="flex flex-wrap items-center gap-3">
          <a href="/profile" className="text-sm font-semibold text-[#007e8d] dark:text-[#99e4c9]">{t("My profile")}</a>
          {user.roles.includes("admin") && <a href="/admin" className="text-sm font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">{t("Admin dashboard")}</a>}
          <button className="sign-in-button" type="button" disabled={signingOut} onClick={logout}>{t(signingOut ? "Signing out…" : "Logout")}</button>
        </div> : <button className="sign-in-button" type="button" disabled={checkingSession} onClick={() => { setMenuOpen(false); setAuthMode("signin"); }}>{t(checkingSession ? "Checking session…" : "Sign in")}</button>}
      </div>
      {logoutError && <p role="alert" className="mx-auto max-w-[1180px] px-4 pb-3 text-sm text-red-800 dark:text-red-200">{t("Unable to sign out. Please try again.")}</p>}
      {authMode === "signin" && <SignInDialog onClose={() => setAuthMode(null)} onRegister={() => setAuthMode("register")} onSignedIn={(account) => { setUser(account); setCheckingSession(false); setLogoutError(false); }} />}
      {authMode === "register" && <RegisterDialog onClose={() => setAuthMode(null)} onSignIn={() => setAuthMode("signin")} />}
    </header>
  );
}
