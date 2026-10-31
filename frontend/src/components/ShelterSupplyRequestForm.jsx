import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const supplyTypes = ["Drinking water", "Dry food", "Clothing", "Bedding & mats", "Hygiene supplies", "Medical supplies", "Other supplies"];
const inputClass = "mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 outline-none focus:border-[#007e8d] focus:ring-2 focus:ring-[#007e8d]/30 dark:border-[#578e83] dark:bg-[#12343d]";

export default function ShelterSupplyRequestForm() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const busyRef = useRef(false);
  const requestRef = useRef(null);
  useEffect(() => () => requestRef.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage(""); setSaved(false);
    const payload = Object.fromEntries(["shelterName", "nearestTown", "phone", "details"].map((key) => [key, String(data.get(key) || "").trim()]));
    if (!selected.length || payload.shelterName.length < 2 || payload.nearestTown.length < 2 || payload.details.length < 5 || (selected.includes("Other supplies") && !String(data.get("otherSupplies") || "").trim())) { setMessage("Please complete the shelter details and select the supplies needed."); return; }
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(payload.phone.replace(/[\s()-]/g, ""))) { setMessage("Enter a valid Sri Lankan phone number."); return; }
    payload.supplies = selected;
    if (selected.includes("Other supplies")) payload.otherSupplies = String(data.get("otherSupplies")).trim();
    busyRef.current = true; setPending(true);
    const controller = new AbortController(); requestRef.current = controller;
    try {
      const response = await fetch("/api/shelter-supplies", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify(payload), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      const body = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (response.status === 201 && body.success) {
        setSaved(true); form.reset(); setSelected([]);
        window.dispatchEvent(new Event("shelter-supplies-updated"));
      } else setMessage(response.status === 401 ? "Please sign in to report a shelter shortage." : response.status === 429 ? "Too many attempts. Please try again later." : "Please check your shelter supply details and try again.");
    } catch { if (!controller.signal.aborted) setMessage("Connection interrupted. Check the supply list before submitting again."); }
    finally { busyRef.current = false; if (!controller.signal.aborted) setPending(false); }
  }

  return <section id="shelter-supply-request" aria-labelledby="shelter-supply-title" className="mt-10 scroll-mt-6 rounded-[28px] border border-[#79b5af] bg-[#d9ecee] p-6 min-[761px]:p-9 dark:border-[#4b817b] dark:bg-[#173b43]">
    <p className="mb-3 text-xs font-bold tracking-widest text-[#007e8d] uppercase dark:text-[#99e4c9]">{t("Support for your shelter")}</p>
    <h2 id="shelter-supply-title" className="text-3xl font-bold">{t("Request supplies for a shelter")}</h2>
    <p className="mt-3 max-w-2xl leading-7">{t("Tell us which shelter needs support, what items are needed and the quantities required.")}</p>
    <p className="mt-3 text-sm">{t("Sign in to report items that are running out at your shelter.")}</p>
    {message && <p role="alert" className="mt-5 rounded-lg border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {saved && <p role="status" className="mt-5 rounded-lg border border-[#73aaa3] p-4">{t("Shortage reported. Volunteers and donors can now take this request.")}</p>}
    <form onSubmit={submit} className="mt-6" aria-busy={pending}>
      <fieldset disabled={pending} className="min-w-0 border-0 p-0"><legend className="sr-only">{t("Request supplies")}</legend>
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
      <button type="submit" disabled={pending} className="mt-6 rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t(pending ? "Reporting shortage…" : "Report shortage")}</button>
      </fieldset>
    </form>
  </section>;
}
