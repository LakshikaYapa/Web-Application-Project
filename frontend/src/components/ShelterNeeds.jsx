import { useLanguage } from "../i18n/useLanguage";
const needs = [
  { id: "water", title: "Drinking water", description: "Bottled water for families staying in shelters.", priority: "High need", high: true },
  { id: "food", title: "Dry food", description: "Rice, canned food, milk powder and biscuits.", priority: "High need", high: true },
  { id: "bedding", title: "Bedding & mats", description: "Mats, blankets and pillows for shelter families.", priority: "Medium need", high: false },
];

function SupplyIcon({ type }) {
  return (
    <svg viewBox="0 0 32 32" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {type === "water" ? (
        <><path d="M12 3h8v5l3 5v13a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V13l3-5V3ZM12 7h8M9 16h14M9 24h14" /><path d="M16 18s-2 2-2 3a2 2 0 0 0 4 0c0-1-2-3-2-3Z" /></>
      ) : type === "food" ? (
        <><path d="M7 4h18l-3 6 4 14a4 4 0 0 1-4 5H10a4 4 0 0 1-4-5l4-14-3-6ZM10 10h12" /><path d="M16 15v10M12 17l4 3 4-3M12 21l4 3 4-3" /></>
      ) : (
        <><path d="M5 20h23v7H5a4 4 0 0 1 0-8h19a4 4 0 0 0 0-8H9l-4 9ZM9 11l3-6h14l-2 6M5 23h18" /></>
      )}
    </svg>
  );
}

export default function ShelterNeeds() {
  const { t } = useLanguage();
  return (
    <section className="shelter-needs-section" aria-labelledby="shelter-needs-title">
      <div className="volunteers-heading">
        <div>
          <div className="volunteers-title-row">
            <h2 id="shelter-needs-title">{t("What shelters need")}</h2>
            <span className="demo-badge">{t("Demo data")}</span>
          </div>
          <p>{t("Help us provide essential items to support affected communities.")}</p>
        </div>
        <div className="volunteers-actions">
          <a href="/shelters#shelter-needs-title" className="rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold text-[#007e8d] dark:text-[#99e4c9]">{t("View all needs")} →</a>
          <a href="/shelters#shelter-supply-request" className="rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white hover:bg-[#005e6b]">{t("Request supplies")}</a>
        </div>
      </div>
      <ul className="shelter-needs-grid">
        {needs.map(({ id, title, description, priority, high }) => (
          <li className={`supply-card supply-${id}`} key={id}>
            <div className="supply-card-content">
              <span className="supply-icon"><SupplyIcon type={id} /></span>
              <div>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
                <span className={`need-priority ${high ? "priority-high" : "priority-medium"}`}>{t(priority)} <span className="sr-only">{t("(demo)")}</span></span>
              </div>
            </div>
            <a href="/funder#funder-form" className="mt-4 flex items-center justify-between rounded-lg bg-[#007e8d] px-4 py-3 font-bold text-white hover:bg-[#005e6b]">{t("Donate supplies")}<span aria-hidden="true">→</span></a>
          </li>
        ))}
      </ul>
      <p className="volunteers-note" id="shelter-needs-note">{t("Sample shelter supply needs. Contact the shelter to confirm current requirements.")}</p>
    </section>
  );
}
