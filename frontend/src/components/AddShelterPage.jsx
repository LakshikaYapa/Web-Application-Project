import { useLanguage } from "../i18n/useLanguage";
import { useState } from "react";

const facilities = [
  { value: "water", label: "Drinking water" },
  { value: "toilets", label: "Toilets" },
  { value: "electricity", label: "Electricity" },
  { value: "first_aid", label: "First aid" },
  { value: "sleeping", label: "Sleeping space" },
  { value: "other", label: "Other facilities" },
];

const inputClass = "mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 outline-none focus:border-[#007e8d] focus:ring-2 focus:ring-[#007e8d]/30 dark:border-[#578e83] dark:bg-[#12343d]";

export default function AddShelterPage() {
  const { t } = useLanguage();
  const [capacity, setCapacity] = useState("");
  const [occupied, setOccupied] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const capacityValid = /^[1-9]\d*$/.test(capacity);
  const occupiedValid = /^\d+$/.test(occupied);
  const overCapacity = capacityValid && occupiedValid && Number(occupied) > Number(capacity);

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-6 min-[761px]:px-6 min-[761px]:py-10">
      <a href="/" className="mb-5 inline-block font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Back to homepage")}</a>
      <section aria-labelledby="add-shelter-title" className="grid items-center gap-8 rounded-[20px] border border-[#79b5af] bg-linear-[120deg,#c9e9e0,#c9e3ec] p-6 min-[761px]:grid-cols-[1.4fr_1fr] min-[761px]:p-10 dark:border-[#4b817b] dark:bg-linear-[120deg,#163f3b,#173344]">
        <div>
        <p className="text-sm font-bold tracking-wide text-[#00685b] dark:text-[#99e4c9]">{t("Support our communities")}</p>
        <h1 id="add-shelter-title" className="my-4 text-[clamp(32px,4vw,48px)] leading-tight font-bold">{t("Add a shelter")}</h1>
        <p className="max-w-2xl leading-8">{t("Share shelter details to help families find a place to stay during flooding.")}</p>
        </div>
        <img src="/shelter-background.jpg" alt={t("A hand shielding a person from the rain")}
          width="440" height="478" className="mx-auto w-full max-w-[440px] rounded-2xl border border-[#438c8b] shadow-lg" />
      </section>
      <section aria-labelledby="shelter-details-title" className="mt-8 rounded-[20px] border border-[#79b5af] bg-[#d9ecee] p-6 min-[761px]:p-8 dark:border-[#4b817b] dark:bg-[#173b43]">
        <h2 id="shelter-details-title" className="text-2xl font-bold">{t("Shelter details")}</h2>
        <p className="mt-2 leading-7">{t("Start with the shelter name, location and a contact number.")}</p>
        <form className="mt-6" onSubmit={(event) => event.preventDefault()}>
          <fieldset className="grid min-w-0 gap-5 min-[761px]:grid-cols-2">
            <legend className="sr-only">{t("Shelter details")}</legend>
            <label htmlFor="shelter-name" className="font-semibold">{t("Shelter name")} <span aria-hidden="true">*</span>
              <input id="shelter-name" name="name" required minLength={2} maxLength={150} className={inputClass} />
            </label>
            <label htmlFor="shelter-town" className="font-semibold">{t("Nearest town")} <span aria-hidden="true">*</span>
              <input id="shelter-town" name="nearestTown" required minLength={2} maxLength={100} autoComplete="address-level2" className={inputClass} />
            </label>
            <label htmlFor="shelter-address" className="font-semibold min-[761px]:col-span-2">{t("Shelter address")} <span aria-hidden="true">*</span>
              <textarea id="shelter-address" name="address" required minLength={5} maxLength={300} autoComplete="street-address" rows={3} aria-describedby="shelter-address-hint" className={`${inputClass} resize-y`} />
              <span id="shelter-address-hint" className="mt-2 block text-sm leading-6 font-normal">{t("Include the road name and a nearby landmark to help people find the shelter.")}</span>
            </label>
            <label htmlFor="shelter-phone" className="font-semibold">{t("Phone number")} <span aria-hidden="true">*</span>
              <input id="shelter-phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" aria-describedby="shelter-phone-hint" className={inputClass} />
              <span id="shelter-phone-hint" className="mt-2 block text-sm leading-6 font-normal">{t("Use 077 123 4567 or +94 77 123 4567.")}</span>
            </label>
          </fieldset>
          <fieldset className="mt-8 border-t border-[#79b5af] pt-6 dark:border-[#4b817b]">
            <legend className="text-lg font-bold">{t("Shelter capacity")}</legend>
            <p className="mb-4 text-sm leading-6">{t("Enter the number of people the shelter can accommodate and how many are staying now.")}</p>
            <div className="grid gap-5 min-[761px]:grid-cols-2">
              <label htmlFor="shelter-capacity" className="font-semibold">{t("Total capacity")} <span aria-hidden="true">*</span>
                <input id="shelter-capacity" name="capacity" type="number" min={1} max={100000} step={1} required value={capacity} onChange={(event) => setCapacity(event.target.value)} className={inputClass} />
              </label>
              <label htmlFor="shelter-occupied" className="font-semibold">{t("Current occupancy")} <span aria-hidden="true">*</span>
                <input id="shelter-occupied" name="occupied" type="number" min={0} max={capacityValid ? Number(capacity) : 100000} step={1} required value={occupied} onChange={(event) => setOccupied(event.target.value)} aria-invalid={overCapacity} aria-describedby={overCapacity ? "shelter-capacity-error" : undefined} className={inputClass} />
              </label>
            </div>
            {overCapacity ? <p id="shelter-capacity-error" role="alert" className="mt-3 text-red-800 dark:text-red-200">{t("Current occupancy cannot exceed total capacity.")}</p> : capacityValid && occupiedValid && <p className="mt-4 inline-block rounded-lg bg-[#b7ded9] px-4 py-2 font-semibold dark:bg-[#285c58]" role="status">{t("Available spaces")}: {Number(capacity) - Number(occupied)}</p>}
          </fieldset>
          <fieldset className="mt-8 border-t border-[#79b5af] pt-6 dark:border-[#4b817b]">
            <legend className="text-lg font-bold">{t("Available facilities")}</legend>
            <p className="mb-4 text-sm leading-6">{t("Select all facilities available at this shelter.")}</p>
            <div className="grid gap-3 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-3">
              {facilities.map((facility) => <label key={facility.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#73aaa3] bg-[#edf7f6] p-4 font-semibold has-checked:border-[#007e8d] has-checked:bg-[#b7ded9] has-focus-visible:ring-2 has-focus-visible:ring-[#007e8d] dark:border-[#578e83] dark:bg-[#12343d] dark:has-checked:bg-[#285c58]">
                <input type="checkbox" name="facilities" value={facility.value} checked={selectedFacilities.includes(facility.value)} onChange={(event) => setSelectedFacilities((previous) => event.target.checked ? [...previous, facility.value] : previous.filter((value) => value !== facility.value))} className="h-5 w-5 shrink-0 accent-[#007e8d]" />
                {t(facility.label)}
              </label>)}
            </div>
            {selectedFacilities.includes("other") && <label htmlFor="shelter-other-facilities" className="mt-5 block font-semibold">{t("Describe other facilities")} <span aria-hidden="true">*</span>
              <textarea id="shelter-other-facilities" name="otherFacilities" required maxLength={500} rows={3} className={`${inputClass} resize-y`} />
            </label>}
          </fieldset>
        </form>
      </section>
    </main>
  );
}
