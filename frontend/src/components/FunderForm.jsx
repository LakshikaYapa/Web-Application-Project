import { useEffect, useRef, useState } from "react";
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
    setMessage("");
    const data = new FormData(event.currentTarget);
    for (const field of ["nearestTown", "phone", "notes", "otherSupport", "amount"]) {
      if (data.has(field)) data.set(field, String(data.get(field)).trim());
    }
    if (!selected.length || !data.get("nearestTown") || (selected.includes("other") && !data.get("otherSupport"))) {
      setMessage("Select support types and complete all required details.");
      return;
    }
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(String(data.get("phone") || "").replace(/[\s()-]/g, ""))) {
      setMessage("Enter a valid Sri Lankan phone number.");
      return;
    }
    if (selected.includes("financial")) {
      const amount = String(data.get("amount") || "");
      if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
        setMessage("Enter a positive LKR amount with up to two decimal places.");
        return;
      }
      const receipt = data.get("receipt");
      if (!(receipt instanceof File) || !receipt.size || receipt.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(receipt.type)) {
        setMessage("Choose a JPG, PNG, WebP or PDF receipt, up to 5 MB.");
        return;
      }
    }
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/contributions", {
        method: "POST", credentials: "same-origin", headers: { "X-CSRF-Protection": "1" },
        body: data, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (response.status === 201 && body.success && body.contribution?.id) {
        setSaved(body.contribution);
      } else {
        const messages = {
          400: "Please check your contribution details and try again.",
          401: "Please sign in using the page header, then submit your contribution again.",
          403: "Unable to submit. Reload this page and try again.",
          413: "Your receipt is too large. Choose a file up to 5 MB.",
          429: "Too many attempts. Please try again later.",
        };
        setMessage(body.code === "INVALID_RECEIPT" ? "Choose a JPG, PNG, WebP or PDF receipt, up to 5 MB." : (messages[response.status] || "Unable to save your contribution. Please try again."));
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Connection interrupted. Your contribution may have been saved. Please check before submitting again.");
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function toggleSupport(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    if (id === "other") setOtherSupport("");
  }

  return <section id="funder-form" className="mt-14 scroll-mt-6 rounded-[28px] border border-[#73aaa3] bg-[#edf6f2] p-6 shadow-[0_12px_32px_rgb(15_64_82/6%)] min-[761px]:p-9 dark:border-[#578e83] dark:bg-[#102f34]" aria-labelledby="funder-form-title">
    <p className="mb-3 text-xs font-bold tracking-[.14em] text-[#007667] uppercase dark:text-[#99e4c9]">03 · {t("Make a contribution")}</p>
    <h2 id="funder-form-title" className="mb-3 text-[28px]">{t("Tell us how you can support")}</h2>
    <p id="funder-form-note" className="text-sm leading-[1.7]">{t("Sign in to submit your contribution details for review.")}</p>
    {saved ? <div className="mt-5 rounded-xl border border-[#73aaa3] bg-white/70 p-5 dark:bg-[#12382f]" role="status" ref={feedbackRef} tabIndex={-1}>
      <h3 className="text-xl font-bold">{t("Contribution submitted")}</h3>
      <p className="mt-3 leading-[1.7]">{t("Your contribution is pending review. This does not confirm a bank payment.")}</p>
      <p className="mt-3 break-all text-sm">{t("Contribution reference")}: {saved.id}</p>
      <a className="mt-4 mr-6 inline-block font-bold text-[#007667] hover:underline dark:text-[#99e4c9]" href="/my-contributions">{t("My contributions")}</a>
      <a className="mt-4 inline-block font-bold text-[#007667] dark:text-[#99e4c9]" href="/">{t("Back to homepage")}</a>
    </div> : <form onSubmit={submit} onChange={() => setMessage("")} aria-describedby="funder-form-note" aria-busy={pending}>
    {message && <p className="mt-5 rounded-lg border border-red-400 bg-red-50 p-4 text-red-900" role="alert" ref={feedbackRef} tabIndex={-1}>{t(message)}</p>}
    <fieldset className="mt-6 grid min-w-0 gap-6 border-0 p-0 min-[761px]:grid-cols-2" disabled={pending}>
      <legend className="sr-only">{t("Tell us how you can support")}</legend>
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
      <button type="submit" disabled={pending} className="col-span-full cursor-pointer justify-self-start rounded-lg bg-[#007667] px-5 py-[13px] font-bold text-white enabled:hover:bg-[#005e53] disabled:cursor-not-allowed disabled:opacity-60">{t(pending ? "Submitting contribution…" : "Submit contribution")}</button>
    </fieldset>
    </form>}
  </section>;
}
