import { useEffect, useState } from "react";

const upcomingPages = ["Flood map", "Shelters", "Volunteer", "Donate"];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
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
        <a className="brand" href="#main" aria-label="FloodGuard home">
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
          {menuOpen ? "Close menu" : "Menu"}
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>

        <nav
          id="primary-navigation"
          className={`primary-navigation${menuOpen ? " is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="#main" aria-current="page" onClick={() => setMenuOpen(false)}>
            Home
          </a>
          {upcomingPages.map((page) => (
            <button type="button" key={page} disabled title="Coming soon">
              {page}
              <span className="sr-only"> — coming soon</span>
            </button>
          ))}
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"}
          onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <button className="sign-in-button" type="button" disabled title="Coming soon">
          Sign in<span className="sr-only"> — coming soon</span>
        </button>
      </div>
    </header>
  );
}
