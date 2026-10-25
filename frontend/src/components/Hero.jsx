function ActionIcon({ help = false }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {help ? (
        <>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" />
        </>
      ) : (
        <>
          <path d="m12 3 10 18H2L12 3Z" />
          <path d="M12 9v5M12 17h.01" />
        </>
      )}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <p className="hero-eyebrow">A safer Sri Lanka, together</p>
        <h1 id="hero-title">Stay informed.<br />Find help. Help others.</h1>
        <p className="hero-description">
          Real-time flood reports, shelter information and ways to support
          affected communities.
        </p>
        <div className="hero-actions">
          <button className="hero-action hero-action-primary" type="button" disabled aria-describedby="hero-preview-note">
            <ActionIcon />
            <span><strong>Report a flood</strong><span>Share what you see</span></span>
          </button>
          <button className="hero-action hero-action-secondary" type="button" disabled aria-describedby="hero-preview-note">
            <ActionIcon help />
            <span><strong>Request help</strong><span>Get support</span></span>
          </button>
        </div>
        <p id="hero-preview-note" className="hero-preview-note">Reporting and help requests are coming soon.</p>
      </div>
      <p className="hero-motto">Stronger communities.<br />Safer tomorrows.</p>
      
    </section>
  );
}
