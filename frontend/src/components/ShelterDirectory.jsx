import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const sampleShelters = [
  { name: "Demo Community Hall", town: "Kandy", occupied: 120, capacity: 200 },
  { name: "Demo School Shelter", town: "Gampaha", occupied: 80, capacity: 100 },
  { name: "Demo Sports Centre", town: "Peradeniya", occupied: 300, capacity: 300 },
];

export default function ShelterDirectory() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const results = sampleShelters.filter((shelter) => [shelter.town, t(shelter.town)].some((town) => town.toLocaleLowerCase().includes(search)));

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-6 min-[761px]:px-6 min-[761px]:py-10">
      <a href="/" className="mb-5 inline-block font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Back to homepage")}</a>
      <section aria-labelledby="directory-title" className="rounded-[20px] border border-[#79b5af] bg-linear-[120deg,#c9e9e0,#c9e3ec] p-6 min-[761px]:p-10 dark:border-[#4b817b] dark:bg-linear-[120deg,#163f3b,#173344]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="directory-title" className="text-[clamp(32px,4vw,48px)] leading-tight font-bold">{t("Shelters")}</h1>
          <span className="rounded-full bg-[#a8d5c5] px-3 py-1 text-sm font-semibold text-[#005849] dark:bg-[#31685c] dark:text-[#e1fff1]">{t("Demo data")}</span>
        </div>
        <p className="mt-4 leading-8">{t("Browse shelter locations and available spaces by town.")}</p>
        <a href="/add-shelter" className="mt-5 inline-block rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white hover:bg-[#005e6b]">+ {t("Add a shelter")}</a>
      </section>
      <section aria-labelledby="directory-results-title" className="mt-8">
        <label htmlFor="shelter-search" className="block max-w-xl font-semibold">{t("Search by town")}
          <input id="shelter-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} className="mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#007e8d]/40 dark:border-[#578e83] dark:bg-[#12343d]" />
        </label>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="directory-results-title" className="text-2xl font-bold">{t("Shelter directory")}</h2>
          <p role="status">{t("Shelters found")}: {results.length}</p>
        </div>
        <p className="mt-3 text-sm leading-7">{t("Demo only. These are not verified shelters or current occupancy figures. Your location has not been used.")}</p>
        {results.length ? <ul className="mt-5 grid list-none gap-5 p-0 min-[761px]:grid-cols-2 min-[1000px]:grid-cols-3">
          {results.map((shelter) => <li key={shelter.name} className="rounded-2xl border border-[#73aaa3] bg-[#d4eae3] p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#007e8d] dark:text-[#99e4c9]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" /></svg>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${shelter.occupied >= shelter.capacity ? "bg-[#f4d5bd] text-[#773f14] dark:bg-[#633c25] dark:text-[#ffe1c9]" : "bg-[#a8d5c5] text-[#005849] dark:bg-[#31685c] dark:text-[#e1fff1]"}`}>{t(shelter.occupied >= shelter.capacity ? "Full" : "Open")} {t("(demo)")}</span>
            </div>
            <h3 className="text-xl font-bold">{t(shelter.name)}</h3>
            <p className="mt-2">{t(shelter.town)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#73aaa3] pt-4 dark:border-[#578e83]">
              <div><dt className="text-sm">{t("Spaces occupied")}</dt><dd className="mt-1 font-bold tabular-nums">{shelter.occupied} / {shelter.capacity}</dd></div>
              <div><dt className="text-sm">{t("Available spaces")}</dt><dd className="mt-1 font-bold tabular-nums">{shelter.capacity - shelter.occupied}</dd></div>
            </dl>
          </li>)}
        </ul> : <div className="mt-5 rounded-2xl border border-[#73aaa3] bg-[#d4eae3] p-6 dark:bg-[#1c443e]">
          <p>{t("No sample shelters match this town. Try another town.")}</p>
          <button type="button" onClick={() => setQuery("")} className="mt-3 rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold hover:bg-[#b7ded9] dark:hover:bg-[#285c58]">{t("Clear search")}</button>
        </div>}
      </section>
    </main>
  );
}
