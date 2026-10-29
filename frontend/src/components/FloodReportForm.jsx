import { useLanguage } from "../i18n/useLanguage";

const fieldClass = "mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 text-[#153e50] outline-none focus:border-[#007e8d] focus:ring-2 focus:ring-[#007e8d]/30 dark:border-[#578e83] dark:bg-[#12343d] dark:text-[#e0f4f5] dark:focus:ring-[#99e4c9]/40";

export default function FloodReportForm() {
  const { t } = useLanguage();

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
      </form>
    </section>
  );
}
