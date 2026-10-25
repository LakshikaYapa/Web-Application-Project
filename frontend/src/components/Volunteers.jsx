import { useLanguage } from "../i18n/useLanguage";
const volunteers = [
  { name: "Tharindu", initials: "TH", district: "Kandy District", role: "Logistics & Transport", color: "teal" },
  { name: "Dilini", initials: "DI", district: "Gampaha District", role: "Relief Distribution", color: "blue" },
  { name: "Kasun", initials: "KA", district: "Matara District", role: "Field Operations", color: "green" },
  { name: "Nimali", initials: "NI", district: "Colombo District", role: "Community Support", color: "purple" },
];

export default function Volunteers() {
  const { t } = useLanguage();
  return (
    <section className="volunteers-section" aria-labelledby="volunteers-title">
      <div className="volunteers-heading">
        <div>
          <div className="volunteers-title-row">
            <h2 id="volunteers-title">{t("Our Volunteers")}</h2>
            <span className="demo-badge">{t("Demo profiles")}</span>
          </div>
          <p>{t("Local people making a difference in their communities.")}</p>
        </div>
        <div className="volunteers-actions">
          <button type="button" disabled aria-describedby="volunteers-note">{t("View all volunteers")}<span aria-hidden="true">→</span></button>
          <button className="volunteers-join" type="button" disabled aria-describedby="volunteers-note">{t("Join the team")}<span aria-hidden="true">+</span></button>
        </div>
      </div>

      <ul className="volunteer-grid">
        {volunteers.map(({ name, initials, district, role, color }) => (
          <li className="volunteer-card" key={name}>
            <div className={`volunteer-portrait portrait-${color}`} aria-hidden="true">
              <span className="volunteer-initials">{initials}</span>
              <span className="volunteer-sample-label">{t("Sample profile")}</span>
            </div>
            <div className="volunteer-details">
              <h3>{t(name)}</h3>
              <p>{t(district)}</p>
              <span className="volunteer-role">{t(role)}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="volunteers-note" id="volunteers-note">{t("Illustrative profiles, not verified volunteers. Volunteer directory and registration coming soon.")}</p>
    </section>
  );
}
