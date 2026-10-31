import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const colors = ["teal", "blue", "green", "purple"];

export default function Volunteers() {
  const { t } = useLanguage();
  const [people, setPeople] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      async function getPeople(path, key, role) {
        const response = await fetch(path, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body[key])) throw new Error("Unable to load profiles");
        const unique = new Map();
        for (const person of body[key]) {
          const identity = `${person.name}\u0000${person.nearestTown}`;
          if (!unique.has(identity)) unique.set(identity, { ...person, role });
        }
        return [...unique.values()].slice(0, 4);
      }
      const results = await Promise.allSettled([
        getPeople("/api/volunteers", "volunteers", "Volunteer"),
        getPeople("/api/contributions", "contributions", "Donator"),
      ]);
      if (!controller.signal.aborted) {
        const combined = new Map();
        const normalize = (value) => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
        for (const person of results.flatMap((result) => result.status === "fulfilled" ? result.value : [])) {
          const identity = JSON.stringify([normalize(person.name), normalize(person.nearestTown)]);
          const existing = combined.get(identity);
          if (existing) {
            if (!existing.roles.includes(person.role)) existing.roles.push(person.role);
          } else combined.set(identity, { ...person, identity, roles: [person.role] });
        }
        setPeople([...combined.values()]);
        setError(results.some((result) => result.status === "rejected"));
      }
    }
    load();
    return () => controller.abort();
  }, [retry]);

  return <section className="volunteers-section" aria-labelledby="volunteers-title">
    <div className="volunteers-heading"><div><h2 id="volunteers-title">{t("Volunteers and donators")}</h2><p>{t("The people supporting our communities.")}</p></div><div className="flex flex-wrap gap-3"><a href="/volunteer" className="rounded-lg border border-[#73aaa3] px-4 py-3 font-semibold">{t("Join the team")}</a><a href="/funder" className="rounded-lg bg-[#007e8d] px-4 py-3 font-bold text-white hover:bg-[#005e6b]">{t("Donate")}</a></div></div>
    {error && <p role="alert" className="mb-4">{t("Some profiles could not be loaded.")} <button type="button" onClick={() => { setPeople(null); setError(false); setRetry((value) => value + 1); }} className="rounded border border-[#73aaa3] px-3 py-1 font-semibold">{t("Refresh list")}</button></p>}
    {!people ? <p role="status">{t("Loading community profiles…")}</p> : <>
      {!people.length && !error && <p>{t("Community profiles will appear here as volunteers join and contributions are approved.")}</p>}
      <ul className="volunteer-grid">{people.map((person, index) => {
        const initials = person.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase();
        return <li className="volunteer-card" key={person.identity}>
          <div className={`volunteer-portrait portrait-${colors[index % colors.length]}`} aria-hidden="true"><span className="volunteer-initials">{initials}</span></div>
          <div className="volunteer-details"><h3>{person.name}</h3><p>{person.nearestTown}</p><span className="volunteer-role">{person.roles.map((role) => t(role)).join(" & ")}</span></div>
        </li>;
      })}</ul>
    </>}
  </section>;
}
