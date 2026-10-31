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
  const [town, setTown] = useState("");
  const [loadState, setLoadState] = useState("loading");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/volunteers/me", {
      credentials: "same-origin", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
    }).then(async (response) => {
      if (response.status === 401) {
        if (!controller.signal.aborted) setLoadState("signin");
        return;
      }
      if (!response.ok) throw new Error("Load failed");
      const body = await response.json();
      if (!body.success || (body.profile !== null && (!body.profile?.areas || typeof body.profile.nearestTown !== "string"))) throw new Error("Invalid profile");
      if (controller.signal.aborted) return;
      setAreas(body.profile?.areas || {});
      setTown(body.profile?.nearestTown || "");
      setLoadState("ready");
    }).catch(() => { if (!controller.signal.aborted) setLoadState("error"); });
    return () => controller.abort();
  }, [reload]);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const pendingRef = useRef(false);
  const requestRef = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { if (feedback) feedbackRef.current?.focus(); }, [feedback]);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current || loadState !== "ready") return;
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

  return <section id="volunteer-form" className="mt-9 rounded-2xl border border-[#73aeb9] bg-[#d9ecef] p-5 min-[761px]:p-7 dark:border-[#578d9d] dark:bg-[#1c4250] [&>h2]:mb-3 [&>h2]:text-[28px] [&>p]:leading-[1.6]" aria-labelledby="volunteer-form-title">
    <h2 id="volunteer-form-title">{t("Offer your support")}</h2>
    <p id="volunteer-form-note">{t("Sign in to save. Saving replaces your previous support areas and skills with the selections below.")}</p>
    {loadState === "loading" && <p role="status">{t("Loading your volunteer details…")}</p>}
    {(loadState === "signin" || loadState === "error") && <div className="rounded-lg border border-[#a04040] bg-[#fff0f0] px-[18px] py-3.5 text-[#812323]" role="alert">
      <p>{t(loadState === "signin" ? "Sign in using the page header, then load your volunteer details." : "Unable to load your volunteer details. Try again before editing.")}</p>
      <button type="button" className="cursor-pointer justify-self-start rounded-lg border-0 bg-[#007e8d] px-5 py-[13px] font-bold text-white enabled:hover:bg-[#006776] disabled:cursor-not-allowed disabled:opacity-60" onClick={() => { setLoadState("loading"); setReload((value) => value + 1); }}>{t("Load my volunteer details")}</button>
    </div>}
    {feedback && <p className={`rounded-lg border px-[18px] py-3.5 ${feedback.success ? "border-[#237750] bg-[#e5f7ed] text-[#155135]" : "border-[#a04040] bg-[#fff0f0] text-[#812323]"}`} ref={feedbackRef} tabIndex={-1} role={feedback.success ? "status" : "alert"}>{t(feedback.text)}</p>}
    <form onSubmit={submit} onChange={() => setFeedback(null)} aria-describedby="volunteer-form-note" aria-busy={pending || loadState === "loading"}>
    <fieldset className="mt-6 grid min-w-0 gap-[22px] border-0 p-0 min-[761px]:grid-cols-2" disabled={pending || loadState !== "ready"}>
      <legend className="sr-only">{t("Offer your support")}</legend>
      <fieldset className="m-0 min-w-0 border-0 p-0 [&_legend]:mb-2.5 [&_legend]:p-0 [&_legend]:font-bold col-span-full" aria-describedby="volunteer-support-hint">
        <legend>{t("How would you like to help?")}</legend>
        <p id="volunteer-support-hint" className="m-0 text-[13px] leading-[1.6]">{t("Select one or more support areas.")}</p>
        <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-2.5">{supportOptions.map((option) => <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#6d9da8] bg-[#edf7f8] p-[13px] has-checked:border-[#00717e] has-checked:bg-[#b5ded8] dark:border-[#578d9d] dark:bg-[#12313e] dark:has-checked:border-[#87e1db] dark:has-checked:bg-[#245c60] [&_input]:m-0 [&_input]:size-[18px] [&_input]:shrink-0 [&_input]:accent-[#00717e]" key={option.id}>
          <input type="checkbox" name="supportAreas" value={option.id} checked={Boolean(areas[option.id])} onChange={() => toggleArea(option.id)} />
          <span>{t(option.label)}</span>
        </label>)}</div>
      </fieldset>
      {areas.other && <div className="grid min-w-0 content-start gap-[9px] [&_label]:text-sm [&_label]:font-bold [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#6d9da8] [&_input]:bg-[#f5fbfc] [&_input]:p-3 [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[#6d9da8] [&_textarea]:bg-[#f5fbfc] [&_textarea]:p-3 dark:[&_input]:border-[#578d9d] dark:[&_input]:bg-[#12313e] dark:[&_textarea]:border-[#578d9d] dark:[&_textarea]:bg-[#12313e] col-span-full">
        <label htmlFor="volunteer-other">{t("Describe the support you can offer")}</label>
        <input id="volunteer-other" name="otherSupport" value={areas.other.otherSupport} onChange={(event) => updateDetails("other", "otherSupport", event.target.value)} required maxLength={200} />
      </div>}
      {!Object.keys(areas).length && <p className="m-0 text-[13px] leading-[1.6] col-span-full">{t("Select a support area to see matching skills.")}</p>}
      {supportOptions.filter((option) => areas[option.id]).map((option) => <fieldset className="rounded-[10px] border border-[#7eafb8] p-[18px] col-span-full m-0 min-w-0 [&_legend]:mb-2.5 [&_legend]:p-0 [&_legend]:font-bold" key={option.id}>
        <legend>{t(option.label)} - {t("Skills")}</legend>
        <p className="m-0 text-[13px] leading-[1.6]">{t("Select all skills that apply, or describe other skills.")}</p>
        <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-2.5">{[...option.skills, "Other skills"].map((skill) => <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#6d9da8] bg-[#edf7f8] p-[13px] has-checked:border-[#00717e] has-checked:bg-[#b5ded8] dark:border-[#578d9d] dark:bg-[#12313e] dark:has-checked:border-[#87e1db] dark:has-checked:bg-[#245c60] [&_input]:m-0 [&_input]:size-[18px] [&_input]:shrink-0 [&_input]:accent-[#00717e]" key={skill}>
          <input type="checkbox" name={`skills-${option.id}`} value={skill} checked={areas[option.id].skills.includes(skill)} onChange={() => toggleSkill(option.id, skill)} />
          <span>{t(skill)}</span>
        </label>)}</div>
        {areas[option.id].skills.includes("Other skills") && <div className="grid min-w-0 content-start gap-[9px] [&_label]:text-sm [&_label]:font-bold [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#6d9da8] [&_input]:bg-[#f5fbfc] [&_input]:p-3 [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[#6d9da8] [&_textarea]:bg-[#f5fbfc] [&_textarea]:p-3 dark:[&_input]:border-[#578d9d] dark:[&_input]:bg-[#12313e] dark:[&_textarea]:border-[#578d9d] dark:[&_textarea]:bg-[#12313e] mt-4">
          <label htmlFor={`volunteer-skills-${option.id}`}>{t("Describe your other skills")}</label>
          <textarea id={`volunteer-skills-${option.id}`} name={`otherSkills-${option.id}`} rows={2} required maxLength={500} value={areas[option.id].otherSkills} onChange={(event) => updateDetails(option.id, "otherSkills", event.target.value)} />
        </div>}
      </fieldset>)}
      <div className="grid min-w-0 content-start gap-[9px] [&_label]:text-sm [&_label]:font-bold [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#6d9da8] [&_input]:bg-[#f5fbfc] [&_input]:p-3 [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[#6d9da8] [&_textarea]:bg-[#f5fbfc] [&_textarea]:p-3 dark:[&_input]:border-[#578d9d] dark:[&_input]:bg-[#12313e] dark:[&_textarea]:border-[#578d9d] dark:[&_textarea]:bg-[#12313e]">
        <label htmlFor="volunteer-town">{t("Nearest town")}</label>
        <input id="volunteer-town" name="nearestTown" autoComplete="address-level2" required maxLength={100} value={town} onChange={(event) => setTown(event.target.value)} />
      </div>
      <button className="cursor-pointer justify-self-start rounded-lg border-0 bg-[#007e8d] px-5 py-[13px] font-bold text-white enabled:hover:bg-[#006776] disabled:cursor-not-allowed disabled:opacity-60 col-span-full" type="submit" disabled={pending || loadState !== "ready"}>{t(pending ? "Saving volunteer details…" : "Save volunteer details")}</button>
    </fieldset>
    </form>
  </section>;
}
