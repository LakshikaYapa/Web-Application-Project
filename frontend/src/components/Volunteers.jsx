import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const areaLabels = { relief: "Relief distribution", transport: "Transport support", community: "Community support", other: "Other help" };
const colors = ["teal", "blue", "green", "purple"];

export default function Volunteers() {
  const { t } = useLanguage();
  const [volunteers, setVolunteers] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/volunteers", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.volunteers)) throw new Error("Unable to load volunteers");
        if (!controller.signal.aborted) setVolunteers(body.volunteers);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    load();
    return () => controller.abort();
  }, [retry]);

  return (
    <section className="volunteers-section" aria-labelledby="volunteers-title">
      <div className="volunteers-heading">
        <div>
          <h2 id="volunteers-title">{t("Our Volunteers")}</h2>
          <p>{t("Local people making a difference in their communities.")}</p>
        </div>
        <a href="/volunteer#volunteer-form" className="inline-flex items-center gap-3 rounded-lg bg-[#007e8d] px-5 py-3 font-bold text-white hover:bg-[#005e6b]">{t("Join the team")} <span aria-hidden="true">+</span></a>
      </div>
      {error ? <div role="alert"><p>{t("Unable to load volunteers. Please try again.")}</p><button type="button" onClick={() => { setError(false); setVolunteers(null); setRetry((value) => value + 1); }} className="mt-3 rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold">{t("Refresh list")}</button></div> : !volunteers ? <p role="status">{t("Loading volunteers…")}</p> : <>
        {!volunteers.length && <p>{t("Our volunteer team is growing. Join us to support your community.")}</p>}
        <ul className="volunteer-grid">{volunteers.map((volunteer, index) => {
          const initials = volunteer.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase();
          return <li className="volunteer-card" key={volunteer.id}>
            <div className={`volunteer-portrait portrait-${colors[index % colors.length]}`} aria-hidden="true"><span className="volunteer-initials">{initials}</span></div>
            <div className="volunteer-details"><h3>{volunteer.name}</h3><p>{volunteer.nearestTown}</p><span className="volunteer-role">{volunteer.supportAreas.map((area) => t(areaLabels[area] || area)).join(", ")}</span></div>
          </li>;
        })}</ul>
      </>}
    </section>
  );
}
