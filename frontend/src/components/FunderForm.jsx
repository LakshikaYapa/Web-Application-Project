import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import FinancialSupportFields from "./FinancialSupportFields";

const supportOptions = [
  { id: "financial", label: "Financial support" },
  { id: "food_water", label: "Food and drinking water" },
  { id: "shelter", label: "Shelter essentials" },
  { id: "relief", label: "Relief operations" },
  { id: "other", label: "Other support" },
];

const inputClass = "w-full min-w-0 rounded-lg border border-[#6d9d91] bg-[#f5fbf8] p-3 dark:border-[#578e83] dark:bg-[#12382f]";

export default function FunderForm() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [otherSupport, setOtherSupport] = useState("");

  function toggleSupport(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    if (id === "other") setOtherSupport("");
  }

  return <section id="funder-form" className="mt-9 rounded-2xl border border-[#73aaa3] bg-[#d4eae3] p-5 min-[761px]:p-7 dark:border-[#578e83] dark:bg-[#1c443e]" aria-labelledby="funder-form-title">
    <h2 id="funder-form-title" className="mb-3 text-[28px]">{t("Tell us how you can support")}</h2>
    <p id="funder-form-note" className="text-sm leading-[1.7]">{t("Form preview only. Details are not saved and no payment is taken.")}</p>
    <form className="mt-6 grid gap-6 min-[761px]:grid-cols-2" onSubmit={(event) => event.preventDefault()} aria-describedby="funder-form-note">
      <fieldset className="col-span-full min-w-0 border-0 p-0" aria-describedby="funder-support-hint">
        <legend className="mb-2 font-bold">{t("What would you like to contribute?")}</legend>
        <p id="funder-support-hint" className="text-[13px] leading-[1.6]">{t("Select one or more types of support.")}</p>
        <div className="mt-3.5 grid gap-2.5 min-[540px]:grid-cols-2 min-[1000px]:grid-cols-3">
          {supportOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#6d9d91] bg-[#edf7f1] p-[13px] has-checked:border-[#006c57] has-checked:bg-[#add8c7] dark:border-[#578e83] dark:bg-[#12382f] dark:has-checked:border-[#99e4c9] dark:has-checked:bg-[#2c6050]">
            <input className="m-0 size-[18px] shrink-0 accent-[#007667]" type="checkbox" name="supportTypes" value={option.id} checked={selected.includes(option.id)} onChange={() => toggleSupport(option.id)} />
            <span>{t(option.label)}</span>
          </label>)}
        </div>
      </fieldset>
      {selected.includes("financial") && <FinancialSupportFields />}
      {selected.includes("other") && <div className="col-span-full grid min-w-0 gap-2">
        <label className="text-sm font-bold" htmlFor="funder-other">{t("Describe the support you can offer")}</label>
        <textarea className={`${inputClass} resize-y`} id="funder-other" name="otherSupport" value={otherSupport} onChange={(event) => setOtherSupport(event.target.value)} required maxLength={500} rows={3} />
      </div>}
      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-bold" htmlFor="funder-town">{t("Nearest town")}</label>
        <input className={inputClass} id="funder-town" name="nearestTown" autoComplete="address-level2" required maxLength={100} />
      </div>
      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-bold" htmlFor="funder-phone">{t("Phone number")}</label>
        <input className={inputClass} id="funder-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} aria-describedby="funder-phone-hint" />
        <p id="funder-phone-hint" className="text-[13px] leading-[1.6]">{t("Use 077 123 4567 or +94 77 123 4567.")}</p>
      </div>
      <div className="col-span-full grid min-w-0 gap-2">
        <label className="text-sm font-bold" htmlFor="funder-notes">{t("Contribution details (optional)")}</label>
        <textarea className={`${inputClass} resize-y`} id="funder-notes" name="notes" maxLength={1000} rows={4} aria-describedby="funder-notes-hint" />
        <p id="funder-notes-hint" className="text-[13px] leading-[1.6]">{t("Describe items, quantities or other details about the support you can offer.")}</p>
      </div>
      <button type="submit" disabled className="col-span-full cursor-not-allowed justify-self-start rounded-lg bg-[#007667] px-5 py-[13px] font-bold text-white opacity-60">{t("Save support details (coming soon)")}</button>
    </form>
  </section>;
}
