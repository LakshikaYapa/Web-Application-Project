import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const supportOptions = [
  { id: "relief", label: "Relief distribution", skills: ["Packing supplies", "Food preparation", "Distributing essentials", "Stock management"] },
  { id: "transport", label: "Transport support", skills: ["Driving", "Route planning", "Loading and unloading", "Vehicle maintenance"] },
  { id: "community", label: "Community support", skills: ["Shelter assistance", "Translation", "Child and elder support", "Community coordination"] },
  { id: "other", label: "Other help", skills: ["Communication", "Organising activities"] },
];

export default function VolunteerForm() {
  const { t } = useLanguage();
  const [areas, setAreas] = useState({});

  function toggleArea(id) {
    setAreas((current) => {
      const next = { ...current };
      if (next[id]) delete next[id];
      else next[id] = { skills: [], otherSkills: "", otherSupport: "" };
      return next;
    });
  }

  function toggleSkill(id, skill) {
    setAreas((current) => {
      const area = current[id];
      const skills = area.skills.includes(skill) ? area.skills.filter((item) => item !== skill) : [...area.skills, skill];
      return { ...current, [id]: { ...area, skills, otherSkills: skills.includes("Other skills") ? area.otherSkills : "" } };
    });
  }

  function updateDetails(id, field, value) {
    setAreas((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  return <section id="volunteer-form" className="volunteer-form-section" aria-labelledby="volunteer-form-title">
    <h2 id="volunteer-form-title">{t("Offer your support")}</h2>
    <p id="volunteer-form-note">{t("Form preview. Your details are not sent or saved yet.")}</p>
    <form className="volunteer-form" onSubmit={(event) => event.preventDefault()} aria-describedby="volunteer-form-note">
      <fieldset className="volunteer-choice-group volunteer-form-wide" aria-describedby="volunteer-support-hint">
        <legend>{t("How would you like to help?")}</legend>
        <p id="volunteer-support-hint" className="volunteer-form-hint">{t("Select one or more support areas.")}</p>
        <div className="volunteer-choice-grid">{supportOptions.map((option) => <label className={`volunteer-choice${areas[option.id] ? " is-selected" : ""}`} key={option.id}>
          <input type="checkbox" name="supportAreas" value={option.id} checked={Boolean(areas[option.id])} onChange={() => toggleArea(option.id)} />
          <span>{t(option.label)}</span>
        </label>)}</div>
      </fieldset>
      {areas.other && <div className="volunteer-form-field volunteer-form-wide">
        <label htmlFor="volunteer-other">{t("Describe the support you can offer")}</label>
        <input id="volunteer-other" name="otherSupport" value={areas.other.otherSupport} onChange={(event) => updateDetails("other", "otherSupport", event.target.value)} required maxLength={200} />
      </div>}
      {!Object.keys(areas).length && <p className="volunteer-form-hint volunteer-form-wide">{t("Select a support area to see matching skills.")}</p>}
      {supportOptions.filter((option) => areas[option.id]).map((option) => <fieldset className="volunteer-choice-group volunteer-skills-group volunteer-form-wide" key={option.id}>
        <legend>{t(option.label)} - {t("Skills")}</legend>
        <p className="volunteer-form-hint">{t("Select all skills that apply, or describe other skills.")}</p>
        <div className="volunteer-choice-grid">{[...option.skills, "Other skills"].map((skill) => <label className={`volunteer-choice${areas[option.id].skills.includes(skill) ? " is-selected" : ""}`} key={skill}>
          <input type="checkbox" name={`skills-${option.id}`} value={skill} checked={areas[option.id].skills.includes(skill)} onChange={() => toggleSkill(option.id, skill)} />
          <span>{t(skill)}</span>
        </label>)}</div>
        {areas[option.id].skills.includes("Other skills") && <div className="volunteer-form-field volunteer-other-skills">
          <label htmlFor={`volunteer-skills-${option.id}`}>{t("Describe your other skills")}</label>
          <textarea id={`volunteer-skills-${option.id}`} name={`otherSkills-${option.id}`} rows={2} required maxLength={500} value={areas[option.id].otherSkills} onChange={(event) => updateDetails(option.id, "otherSkills", event.target.value)} />
        </div>}
      </fieldset>)}
      <div className="volunteer-form-field">
        <label htmlFor="volunteer-town">{t("Nearest town")}</label>
        <input id="volunteer-town" name="nearestTown" autoComplete="address-level2" required maxLength={100} />
      </div>
      <button className="volunteer-form-submit volunteer-form-wide" type="submit" disabled>{t("Submit volunteer details (coming soon)")}</button>
    </form>
  </section>;
}
