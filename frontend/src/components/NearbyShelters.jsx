import { useLanguage } from "../i18n/useLanguage";
const shelters = [
  { name: "Demo Community Hall", district: "Kandy", occupied: 120, capacity: 200 },
  { name: "Demo School Shelter", district: "Gampaha", occupied: 80, capacity: 100 },
  { name: "Demo Sports Centre", district: "Peradeniya", occupied: 300, capacity: 300 },
];

function ShelterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" />
    </svg>
  );
}

export default function NearbyShelters() {
  const { t } = useLanguage();
  return (
    <section className="shelters-card" aria-labelledby="shelters-title">
      <div className="flood-map-heading">
        <h2 id="shelters-title"><ShelterIcon />{t("Nearby shelters")}</h2>
        <span className="demo-badge">{t("Demo data")}</span>
      </div>
      <p className="shelters-intro">{t("Sample shelter locations and available spaces.")}</p>
      <ul className="shelter-list">
        {shelters.map(({ name, district, occupied, capacity }) => {
          const full = occupied >= capacity;
          return (
            <li className="shelter-row" key={name}>
              <span className="shelter-icon"><ShelterIcon /></span>
              <div className="shelter-info">
                <h3>{t(name)}</h3>
                <p>{t(district)}</p>
              </div>
              <div className="shelter-capacity">
                <span aria-label={`${t("Spaces occupied")}: ${occupied} / ${capacity}`}>{occupied} / {capacity}</span>
                <span className={`shelter-status ${full ? "is-full" : "is-open"}`}>{full ? t("Full") : t("Open")}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="shelters-note" id="shelters-note">{t("Demo only. These are not verified shelters or current occupancy figures. Your location has not been used.")}</p>
      <button className="map-preview-button" type="button" disabled aria-describedby="shelters-note shelters-coming-soon">{t("View all shelters")}<span aria-hidden="true">→</span></button>
      <span className="map-coming-soon" id="shelters-coming-soon">{t("Shelter directory coming soon")}</span>
    </section>
  );
}
