import { useLanguage } from "../i18n/useLanguage";
import { useEffect, useRef, useState } from "react";

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
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(null);
  const requestRef = useRef(null);
  const pendingRef = useRef(false);
  const feedbackRef = useRef(null);
  const capacityValid = /^[1-9]\d*$/.test(capacity);
  const occupiedValid = /^\d+$/.test(occupied);
  const overCapacity = capacityValid && occupiedValid && Number(occupied) > Number(capacity);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { if (message || saved) feedbackRef.current?.focus(); }, [message, saved]);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage("");
    const values = Object.fromEntries(["name", "nearestTown", "address", "phone"].map((field) => [field, String(data.get(field) || "").trim()]));
    if (values.name.length < 2 || values.nearestTown.length < 2 || values.address.length < 5 || (selectedFacilities.includes("other") && !String(data.get("otherFacilities") || "").trim())) {
      setMessage("Please check your shelter details and try again.");
      return;
    }
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(values.phone.replace(/[\s()-]/g, ""))) {
      setMessage("Enter a valid Sri Lankan phone number.");
      return;
    }
    if (!capacityValid || !occupiedValid || overCapacity || Number(capacity) > 100000) {
      setMessage("Enter valid whole numbers for capacity and occupancy.");
      return;
    }
    const payload = { ...values, capacity: Number(capacity), occupied: Number(occupied), facilities: [...selectedFacilities], ...(selectedFacilities.includes("other") ? { otherFacilities: String(data.get("otherFacilities")).trim() } : {}) };
    const controller = new AbortController();
    requestRef.current = controller;
    pendingRef.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/shelters", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" },
        body: JSON.stringify(payload), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (response.status === 201 && body.success && body.shelter?.id) {
        setSaved({ ...body.shelter, details: payload });
        form.reset();
        setCapacity("");
        setOccupied("");
        setSelectedFacilities([]);
      } else {
        const messages = {
          400: "Please check your shelter details and try again.",
          401: "Please sign in using the page header, then submit your shelter again.",
          403: "Unable to submit. Reload this page and try again.",
          429: "Too many attempts. Please try again later.",
        };
        setMessage(messages[response.status] || "Unable to save your shelter. Please try again.");
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Connection interrupted. Your shelter may have been saved. Please check before submitting again.");
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

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
        <h2 id="shelter-details-title" className="text-2xl font-bold">{t(saved ? "Add another shelter" : "Shelter details")}</h2>
        <p className="mt-2 leading-7">{t("Start with the shelter name, location and a contact number.")}</p>
        <p className="mt-2 text-sm leading-6">{t("Sign in to submit shelter details for review.")}</p>
        {saved && <div className="mt-5 rounded-xl border border-[#73aaa3] bg-white/70 p-5 dark:bg-[#12343d]">
          <p role="status" ref={message ? undefined : feedbackRef} tabIndex={-1} className="font-semibold">{t("Shelter submitted. You can add another shelter below.")}</p>
          <details key={saved.id} className="mt-3">
            <summary className="cursor-pointer rounded-md py-2 font-bold text-[#007e8d] dark:text-[#99e4c9]">{t("View last submitted shelter")}</summary>
            <p className="mt-3 break-all text-sm">{t("Shelter reference")}: {saved.id}</p>
            <p className="mt-2 text-sm">{t("Your shelter details are pending review.")}</p>
            <dl className="mt-4 grid gap-4 min-[600px]:grid-cols-2">
              {[["Shelter name", saved.details.name], ["Nearest town", saved.details.nearestTown], ["Shelter address", saved.details.address], ["Phone number", saved.details.phone], ["Total capacity", saved.details.capacity], ["Current occupancy", saved.details.occupied], ["Available spaces", saved.details.capacity - saved.details.occupied], ["Available facilities", saved.details.facilities.map((value) => t(facilities.find((facility) => facility.value === value).label)).join(", ") || "—"], ...(saved.details.otherFacilities ? [["Describe other facilities", saved.details.otherFacilities]] : [])].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 whitespace-pre-wrap wrap-break-word leading-7">{value}</dd></div>)}
            </dl>
          </details>
        </div>}
        <form className="mt-6" onSubmit={submit} aria-busy={pending}>
          {message && <p role="alert" ref={feedbackRef} tabIndex={-1} className="mb-5 rounded-lg border border-red-400 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-200">{t(message)}</p>}
          <fieldset disabled={pending} className="min-w-0 border-0 p-0 disabled:opacity-70">
          <legend className="sr-only">{t("Shelter details")}</legend>
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
          <button type="submit" disabled={pending} className="mt-6 rounded-xl bg-[#007e8d] px-6 py-3 font-bold text-white enabled:hover:bg-[#005e6b] disabled:cursor-not-allowed disabled:opacity-60">{t(pending ? "Submitting shelter…" : "Submit shelter")}</button>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
