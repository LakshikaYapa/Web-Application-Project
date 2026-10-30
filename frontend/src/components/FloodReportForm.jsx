import { useLanguage } from "../i18n/useLanguage";
import { useEffect, useRef, useState } from "react";
import FloodReportPhotos from "./FloodReportPhotos";

const situations = [
  { value: "road", label: "Flooded road" },
  { value: "homes", label: "Flooded homes" },
  { value: "rising_water", label: "Rising water" },
  { value: "other", label: "Other situation" },
];

const fieldClass = "mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 text-[#153e50] outline-none focus:border-[#007e8d] focus:ring-2 focus:ring-[#007e8d]/30 dark:border-[#578e83] dark:bg-[#12343d] dark:text-[#e0f4f5] dark:focus:ring-[#99e4c9]/40";

export default function FloodReportForm() {
  const { t } = useLanguage();
  const [selectedSituations, setSelectedSituations] = useState([]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(null);
  const pendingRef = useRef(false);
  const requestRef = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { if (message || saved) feedbackRef.current?.focus(); }, [message, saved]);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = event.currentTarget;
    setMessage("");
    const data = new FormData(form);
    for (const field of ["nearestTown", "location", "description", "phone", "otherSituation"]) {
      if (data.has(field)) data.set(field, String(data.get(field)).trim());
    }
    if (!selectedSituations.length) {
      setMessage("Choose at least one flood situation.");
      return;
    }
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(String(data.get("phone") || "").replace(/[\s()-]/g, ""))) {
      setMessage("Enter a valid Sri Lankan phone number.");
      return;
    }
    if (["nearestTown", "location", "description", ...(selectedSituations.includes("other") ? ["otherSituation"] : [])].some((field) => !data.get(field)) || String(data.get("description")).length < 10) {
      setMessage("Please check your report details and try again.");
      return;
    }
    photos.forEach((file) => data.append("photos", file));
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/flood-reports", {
        method: "POST", credentials: "same-origin", headers: { "X-CSRF-Protection": "1" },
        body: data, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (response.status === 201 && body.success && body.report?.id) {
        setSaved({ ...body.report, details: Object.fromEntries(["nearestTown", "location", "description", "phone", "otherSituation"].map((field) => [field, data.get(field)])), situations: [...selectedSituations], photoNames: photos.map((file) => file.name) });
        form.reset();
        setSelectedSituations([]);
        setDescription("");
        setPhotos([]);
      } else {
        const messages = {
          400: "Please check your report details and try again.",
          401: "Please sign in using the page header, then submit your report again.",
          403: "Unable to submit. Reload this page and try again.",
          413: "Photos are too large. Use up to 3 images, maximum 5 MB each.",
          429: "Too many attempts. Please try again later.",
        };
        setMessage(body.code === "INVALID_PHOTOS" ? "Use JPG, PNG or WebP images, up to 5 MB each." : (messages[response.status] || "Unable to save your report. Please try again."));
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Connection interrupted. Your report may have been saved. Please check before submitting again.");
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <section id="submit-flood-report" aria-labelledby="report-form-title" className="mt-9 scroll-mt-6 rounded-[20px] border border-[#79b5af] bg-[#d9ecee] p-6 min-[761px]:p-8 dark:border-[#4b817b] dark:bg-[#173b43]">
      <h2 id="report-form-title" className="text-2xl font-bold">{t(saved ? "Submit a new flood report" : "Flood report details")}</h2>
      <p className="mt-2 leading-7">{t("Start with the location where you observed flooding.")}</p>
      <p className="mt-2 text-sm leading-6">{t("Sign in to submit a flood report for review.")}</p>
      {saved && <div className="mt-6 rounded-xl border border-[#73aaa3] bg-white/70 p-5 dark:bg-[#12343d]">
        <p role="status" ref={message ? undefined : feedbackRef} tabIndex={-1} className="font-semibold">{t("Flood report submitted")}. {t("You can submit a new report below.")}</p>
        <details key={saved.id} className="mt-3">
          <summary className="cursor-pointer rounded-md py-2 font-bold text-[#007e8d] focus-visible:outline-2 dark:text-[#99e4c9]">{t("View last submitted report")}</summary>
          <p className="mt-3 break-all text-sm">{t("Report reference")}: {saved.id}</p>
          <p className="mt-2 text-sm">{t("Your report has been saved and is pending review.")}</p>
          <dl className="mt-4 grid gap-4 min-[600px]:grid-cols-2">
            {[["Nearest town", saved.details.nearestTown], ["Location or nearby landmark", saved.details.location], ["Phone number", saved.details.phone], ["What is happening?", saved.situations.map((value) => t(situations.find((item) => item.value === value).label)).join(", ")], ...(saved.details.otherSituation ? [["Describe the other situation", saved.details.otherSituation]] : []), ["Describe the situation", saved.details.description]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 whitespace-pre-wrap wrap-break-word leading-7">{value}</dd></div>)}
          </dl>
          <p className="mt-4 text-sm">{t("Photos saved")}: {saved.photoCount}</p>
          <ul className="mt-2 list-inside list-disc text-sm">{saved.photoNames.map((name, index) => <li key={index} className="wrap-break-word">{name}</li>)}</ul>
        </details>
      </div>}
      <form className="mt-6" onSubmit={submit} aria-busy={pending}>
        {message && <p role="alert" ref={feedbackRef} tabIndex={-1} className="mb-5 rounded-lg border border-red-400 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-200">{t(message)}</p>}
        <fieldset disabled={pending} className="min-w-0 border-0 p-0 disabled:opacity-70">
        <legend className="sr-only">{t("Flood report details")}</legend>
        <fieldset>
          <legend className="mb-4 text-lg font-bold">{t("Report location")}</legend>
          <div className="grid gap-5 min-[761px]:grid-cols-2">
            <label htmlFor="report-town" className="block font-semibold">
              {t("Nearest town")} <span aria-hidden="true">*</span>
              <input id="report-town" name="nearestTown" type="text" required minLength={2} maxLength={100} autoComplete="address-level2" className={fieldClass} />
            </label>
            <label htmlFor="report-location" className="block font-semibold">
              {t("Location or nearby landmark")} <span aria-hidden="true">*</span>
              <input id="report-location" name="location" type="text" required minLength={2} maxLength={300} aria-describedby="report-location-hint" className={fieldClass} />
              <span id="report-location-hint" className="mt-2 block text-sm leading-6 font-normal">{t("Include a road name, bridge or nearby landmark to help identify the place.")}</span>
            </label>
          </div>
        </fieldset>
        <fieldset className="mt-8 border-t border-[#79b5af] pt-6 dark:border-[#4b817b]">
          <legend className="text-lg font-bold">{t("What is happening?")}</legend>
          <p id="report-situations-hint" className="mb-4 text-sm leading-6">{t("Select all situations you observed.")}</p>
          <div className="grid gap-3 min-[600px]:grid-cols-2" aria-describedby="report-situations-hint">
            {situations.map((situation) => (
              <label key={situation.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#73aaa3] bg-[#edf7f6] p-4 font-semibold has-checked:border-[#007e8d] has-checked:bg-[#b7ded9] has-focus-visible:ring-2 has-focus-visible:ring-[#007e8d] dark:border-[#578e83] dark:bg-[#12343d] dark:has-checked:bg-[#285c58]">
                <input type="checkbox" name="situations" value={situation.value} checked={selectedSituations.includes(situation.value)} onChange={(event) => setSelectedSituations((previous) => event.target.checked ? [...previous, situation.value] : previous.filter((value) => value !== situation.value))} className="h-5 w-5 shrink-0 accent-[#007e8d]" />
                {t(situation.label)}
              </label>
            ))}
          </div>
          {selectedSituations.includes("other") && (
            <label htmlFor="report-other-situation" className="mt-5 block font-semibold">
              {t("Describe the other situation")} <span aria-hidden="true">*</span>
              <input id="report-other-situation" name="otherSituation" type="text" required maxLength={200} className={fieldClass} />
            </label>
          )}
          <label htmlFor="report-description" className="mt-6 block font-semibold">
            {t("Describe the situation")} <span aria-hidden="true">*</span>
            <textarea id="report-description" name="description" required minLength={10} maxLength={2000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} aria-describedby="report-description-hint report-description-count" className={`${fieldClass} resize-y`} />
          </label>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm leading-6">
            <p id="report-description-hint">{t("Mention affected roads or homes and whether the water is rising or receding.")}</p>
            <p id="report-description-count" className="tabular-nums">{description.length} / 2000</p>
          </div>
        </fieldset>
        <fieldset className="mt-8 border-t border-[#79b5af] pt-6 dark:border-[#4b817b]">
          <legend className="text-lg font-bold">{t("Contact details")}</legend>
          <label htmlFor="report-phone" className="mt-4 block max-w-lg font-semibold">
            {t("Phone number")} <span aria-hidden="true">*</span>
            <input id="report-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" maxLength={30} aria-describedby="report-phone-hint" className={fieldClass} />
          </label>
          <p id="report-phone-hint" className="mt-2 text-sm leading-6">{t("Use 077 123 4567 or +94 77 123 4567.")}</p>
        </fieldset>
        <FloodReportPhotos key={saved?.id ?? "new"} photos={photos} setPhotos={setPhotos} />
        <button type="submit" disabled={pending} className="mt-6 rounded-xl bg-[#007e8d] px-6 py-3 font-bold text-white enabled:hover:bg-[#005e6b] disabled:cursor-not-allowed disabled:opacity-60">{t(pending ? "Submitting report…" : "Submit report")}</button>
        </fieldset>
      </form>
    </section>
  );
}
