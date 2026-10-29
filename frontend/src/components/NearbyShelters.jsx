import { useLanguage } from "../i18n/useLanguage";
import { useShelters } from "./useShelters";
import { sampleShelters } from "./sampleShelters";

function ShelterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" />
    </svg>
  );
}

export default function NearbyShelters() {
  const { t } = useLanguage();
  const { shelters, loading, error, refresh } = useShelters();
  return (
    <section className="shelters-card" aria-labelledby="shelters-title">
      <div className="flood-map-heading">
        <h2 id="shelters-title"><ShelterIcon />{t("Shelters")}</h2>
      </div>
      <p className="shelters-intro">{t("Recently added community shelters.")}</p>
      <a href="/add-shelter" className="mb-3 inline-block rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold text-[#007e8d] hover:bg-[#d4eae3] dark:text-[#99e4c9] dark:hover:bg-[#285c58]">+ {t("Add a shelter")}</a>
      {loading ? <p role="status">{t("Loading shelters…")}</p> : error ? <div role="alert"><p>{t("Unable to load shelters. Please refresh the list.")}</p><button type="button" onClick={refresh} className="my-2 rounded border border-[#73aaa3] px-3 py-2">{t("Refresh list")}</button></div> : null}
      <ul className="shelter-list">
        {[...(!loading && !error ? shelters.slice(0, 3) : []), ...sampleShelters].map(({ id, name, nearestTown, occupied, capacity }) => {
          return (
            <li className="shelter-row" key={id}>
              <span className="shelter-icon"><ShelterIcon /></span>
              <div className="shelter-info">
                <h3>{id.startsWith("sample-") ? t(name) : name}</h3>
                <p>{id.startsWith("sample-") ? t(nearestTown) : nearestTown}</p>
              </div>
              <div className="shelter-capacity">
                <span aria-label={`${t("Spaces occupied")}: ${occupied} / ${capacity}`}>{occupied} / {capacity}</span>
                <span className="rounded-full bg-[#f4d5bd] px-2 py-1 text-xs text-[#773f14] dark:bg-[#633c25] dark:text-[#ffe1c9]">{t("Pending review")}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="shelters-note" id="shelters-note">{t("Community-submitted shelters are pending review. Occupancy is supplied by the submitter.")}</p>
      <a className="map-preview-button" href="/shelters">{t("View all shelters")}<span aria-hidden="true">→</span></a>
    </section>
  );
}
