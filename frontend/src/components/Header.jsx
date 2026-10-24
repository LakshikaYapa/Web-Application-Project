import { useState } from "react";

const upcomingPages = ["Flood map", "Shelters", "Volunteer", "Donate"];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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

        <button className="sign-in-button" type="button" disabled title="Coming soon">
          Sign in<span className="sr-only"> — coming soon</span>
        </button>
      </div>
    </header>
  );
}
