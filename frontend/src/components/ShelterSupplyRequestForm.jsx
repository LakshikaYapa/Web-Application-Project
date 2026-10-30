import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const supplyTypes = ["Drinking water", "Dry food", "Bedding & mats", "Hygiene supplies", "Medical supplies", "Other supplies"];
const inputClass = "mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 outline-none focus:border-[#007e8d] focus:ring-2 focus:ring-[#007e8d]/30 dark:border-[#578e83] dark:bg-[#12343d]";

export default function ShelterSupplyRequestForm() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);

  return <section id="shelter-supply-request" aria-labelledby="shelter-supply-title" className="mt-10 scroll-mt-6 rounded-[28px] border border-[#79b5af] bg-[#d9ecee] p-6 min-[761px]:p-9 dark:border-[#4b817b] dark:bg-[#173b43]">
    <p className="mb-3 text-xs font-bold tracking-widest text-[#007e8d] uppercase dark:text-[#99e4c9]">{t("Support for your shelter")}</p>
    <h2 id="shelter-supply-title" className="text-3xl font-bold">{t("Request supplies for a shelter")}</h2>
    <p className="mt-3 max-w-2xl leading-7">{t("Tell us which shelter needs support, what items are needed and the quantities required.")}</p>
    <form onSubmit={(event) => event.preventDefault()} className="mt-6">
      <fieldset className="grid min-w-0 gap-5 min-[761px]:grid-cols-2"><legend className="sr-only">{t("Shelter details")}</legend>
        <label htmlFor="supply-shelter" className="font-semibold">{t("Shelter name")} <span aria-hidden="true">*</span><input id="supply-shelter" name="shelterName" required minLength={2} maxLength={150} className={inputClass} /></label>
        <label htmlFor="supply-town" className="font-semibold">{t("Nearest town")} <span aria-hidden="true">*</span><input id="supply-town" name="nearestTown" required minLength={2} maxLength={100} className={inputClass} /></label>
        <label htmlFor="supply-phone" className="font-semibold">{t("Phone number")} <span aria-hidden="true">*</span><input id="supply-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} aria-describedby="supply-phone-hint" className={inputClass} /><span id="supply-phone-hint" className="mt-2 block text-sm font-normal">{t("Use 077 123 4567 or +94 77 123 4567.")}</span></label>
      </fieldset>
      <fieldset className="mt-8 border-t border-[#79b5af] pt-6 dark:border-[#4b817b]"><legend className="text-lg font-bold">{t("What supplies are needed?")}</legend><p className="mb-4 text-sm leading-7">{t("Select one or more supply types.")}</p>
        <div className="grid gap-3 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-3">{supplyTypes.map((type) => <label key={type} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#73aaa3] bg-[#edf7f6] p-4 font-semibold has-checked:bg-[#b7ded9] has-focus-visible:ring-2 has-focus-visible:ring-[#007e8d] dark:border-[#578e83] dark:bg-[#12343d] dark:has-checked:bg-[#285c58]"><input type="checkbox" name="supplies" value={type} checked={selected.includes(type)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, type] : current.filter((value) => value !== type))} className="h-5 w-5 accent-[#007e8d]" />{t(type)}</label>)}</div>
        {selected.includes("Other supplies") && <label htmlFor="supply-other" className="mt-5 block font-semibold">{t("Describe other supplies")} <span aria-hidden="true">*</span><input id="supply-other" name="otherSupplies" required maxLength={300} className={inputClass} /></label>}
        <label htmlFor="supply-quantities" className="mt-6 block font-semibold">{t("Items, quantities and delivery details")} <span aria-hidden="true">*</span><textarea id="supply-quantities" name="details" required maxLength={2000} rows={4} aria-describedby="supply-quantities-hint" className={`${inputClass} resize-y`} /><span id="supply-quantities-hint" className="mt-2 block text-sm leading-7 font-normal">{t("For example: 50 drinking water bottles and 20 sleeping mats. Include where supplies can be delivered.")}</span></label>
      </fieldset>
    </form>
  </section>;
}
