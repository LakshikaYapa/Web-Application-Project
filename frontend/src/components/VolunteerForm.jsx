import { useEffect, useRef, useState } from "react";
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
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const pendingRef = useRef(false);
  const requestRef = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { if (feedback) feedbackRef.current?.focus(); }, [feedback]);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const nearestTown = String(new FormData(event.currentTarget).get("nearestTown") || "").trim();
    const entries = Object.entries(areas);
    if (!nearestTown || !entries.length || entries.some(([id, details]) => !details.skills.length
      || (id === "other" && !details.otherSupport.trim())
      || (details.skills.includes("Other skills") && !details.otherSkills.trim()))) {
      setFeedback({ text: "Select support areas and skills, and complete all required details.", success: false });
      return;
    }
    pendingRef.current = true;
    setPending(true);
    setFeedback(null);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/volunteers/me", {
        method: "PUT", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" },
        body: JSON.stringify({ nearestTown, areas }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.success && body.profile?.id) {
        setFeedback({ text: "Your volunteer details have been saved.", success: true });
      } else {
        const messages = {
          400: "Please check your support areas, skills and town, then try again.",
          401: "Please sign in using the page header, then save your volunteer details again.",
          403: "Unable to save. Reload this page and try again.",
          409: "Another save is in progress. Please try again.",
          429: "Too many attempts. Please try again later.",
        };
        setFeedback({ text: messages[response.status] || "Unable to save your volunteer details. Please try again.", success: false });
      }
    } catch {
      if (!controller.signal.aborted) setFeedback({ text: "Connection interrupted. Please try saving again.", success: false });
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

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
    <p id="volunteer-form-note">{t("Sign in to save. Saving replaces your previous support areas and skills with the selections below.")}</p>
    {feedback && <p className={`volunteer-feedback${feedback.success ? " is-success" : ""}`} ref={feedbackRef} tabIndex={-1} role={feedback.success ? "status" : "alert"}>{t(feedback.text)}</p>}
    <form onSubmit={submit} onChange={() => setFeedback(null)} aria-describedby="volunteer-form-note" aria-busy={pending}>
    <fieldset className="volunteer-form" disabled={pending}>
      <legend className="sr-only">{t("Offer your support")}</legend>
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
      <button className="volunteer-form-submit volunteer-form-wide" type="submit" disabled={pending}>{t(pending ? "Saving volunteer details…" : "Save volunteer details")}</button>
    </fieldset>
    </form>
  </section>;
}
