import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

export default function VolunteerForm() {
  const { t } = useLanguage();
  const [supportArea, setSupportArea] = useState("");
  return <section id="volunteer-form" className="volunteer-form-section" aria-labelledby="volunteer-form-title">
    <h2 id="volunteer-form-title">{t("Offer your support")}</h2>
    <p id="volunteer-form-note">{t("Form preview. Your details are not sent or saved yet.")}</p>
    <form className="volunteer-form" onSubmit={(event) => event.preventDefault()} aria-describedby="volunteer-form-note">
      <div className="volunteer-form-field">
        <label htmlFor="volunteer-support">{t("How would you like to help?")}</label>
        <select id="volunteer-support" name="supportArea" value={supportArea} onChange={(event) => setSupportArea(event.target.value)} required>
          <option value="" disabled>{t("Select a support area")}</option>
          {["Relief distribution", "Transport support", "Community support", "Other help"].map((area) => <option key={area} value={area}>{t(area)}</option>)}
        </select>
      </div>
      {supportArea === "Other help" && <div className="volunteer-form-field">
        <label htmlFor="volunteer-other">{t("Describe the support you can offer")}</label>
        <input id="volunteer-other" name="otherSupport" required maxLength={200} />
      </div>}
      <div className="volunteer-form-field">
        <label htmlFor="volunteer-town">{t("Nearest town")}</label>
        <input id="volunteer-town" name="nearestTown" autoComplete="address-level2" required maxLength={100} />
      </div>
      <div className="volunteer-form-field">
        <label htmlFor="volunteer-availability">{t("When are you available?")}</label>
        <select id="volunteer-availability" name="availability" defaultValue="" required>
          <option value="" disabled>{t("Select your availability")}</option>
          {["Weekdays", "Weekends", "Weekdays and weekends", "Flexible availability"].map((time) => <option key={time} value={time}>{t(time)}</option>)}
        </select>
      </div>
      <div className="volunteer-form-field volunteer-form-wide">
        <label htmlFor="volunteer-notes">{t("Skills and availability details (optional)")}</label>
        <textarea id="volunteer-notes" name="notes" rows={4} maxLength={1000} aria-describedby="volunteer-notes-hint" />
        <p id="volunteer-notes-hint" className="volunteer-form-hint">{t("Tell us about your skills and the days or times you can help.")}</p>
      </div>
      <button className="volunteer-form-submit" type="submit" disabled>{t("Submit volunteer details (coming soon)")}</button>
    </form>
  </section>;
}
