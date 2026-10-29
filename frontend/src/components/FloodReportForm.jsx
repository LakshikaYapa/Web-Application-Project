import { useLanguage } from "../i18n/useLanguage";
import { useState } from "react";

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

  return (
    <section aria-labelledby="report-form-title" className="mt-9 rounded-[20px] border border-[#79b5af] bg-[#d9ecee] p-6 min-[761px]:p-8 dark:border-[#4b817b] dark:bg-[#173b43]">
      <h2 id="report-form-title" className="text-2xl font-bold">{t("Flood report details")}</h2>
      <p className="mt-2 leading-7">{t("Start with the location where you observed flooding.")}</p>
      <form className="mt-6" onSubmit={(event) => event.preventDefault()}>
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
      </form>
    </section>
  );
}
