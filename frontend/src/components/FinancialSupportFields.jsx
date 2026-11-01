import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { donationBank } from "../config/donation-bank";

function ReceiptPreview({ file }) {
  const imageRef = useRef(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={imageRef} alt={file.name} className="max-h-64 max-w-full rounded-lg object-contain" />;
}

export default function FinancialSupportFields() {
  const { t } = useLanguage();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const bankReady = Object.values(donationBank).every((value) => value.trim());

  function selectReceipt(event) {
    const file = event.target.files?.[0];
    setReceipt(null);
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setError("Choose a JPG, PNG, WebP or PDF receipt, up to 5 MB.");
      return;
    }
    setReceipt(file);
  }

  return <fieldset className="col-span-full min-w-0 rounded-2xl border border-[#8cb7ab] bg-white/70 p-5 min-[761px]:p-7 dark:border-[#426e62] dark:bg-[#102e29]">
    <legend className="px-3 text-lg font-bold">{t("Financial support")}</legend>
    <p className="mb-6 max-w-3xl text-sm leading-[1.8] text-[#4b6961] dark:text-[#bad5cd]">{t("Transfer your contribution to the bank account below, then enter the amount paid and attach your receipt.")}</p>
    <div className="grid items-start gap-6 min-[900px]:grid-cols-[1.05fr_1fr]">
    {bankReady ? <div className="overflow-hidden rounded-2xl border border-[#244a5b] bg-linear-[135deg,#183e50,#0c2637] p-6 text-white shadow-lg shadow-[#123a43]/10 min-[761px]:p-7">
      <div className="mb-7 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-[#9de1cd]" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-6 9 6H3ZM5 12v6m5-6v6m4-6v6m5-6v6M3 21h18" /></svg>
        </span>
        <div><p className="text-xs font-medium tracking-wider text-[#add1d6]">{t("Bank transfer")}</p><h3 className="mt-1 text-lg font-bold">{donationBank.bankName}</h3></div>
      </div>
      <dl>
        <div className="mb-6"><dt className="mb-2 text-xs font-medium text-[#add1d6]">{t("Account number")}</dt><dd className="break-all font-mono text-[clamp(22px,3vw,30px)] tracking-[.1em]">{donationBank.accountNumber}</dd></div>
        <div className="grid gap-5 border-t border-white/15 pt-5 min-[540px]:grid-cols-2 min-[900px]:grid-cols-1 min-[1100px]:grid-cols-2">
          {[["Account holder", donationBank.accountName], ["Branch", donationBank.branch]].map(([label, value]) => <div key={label}>
            <dt className="text-xs text-[#add1d6]">{t(label)}</dt><dd className="mt-1.5 break-words text-sm font-medium leading-relaxed">{value}</dd>
          </div>)}
        </div>
      </dl>
    </div> : <p className="rounded-xl border border-[#8cb7ab] p-5 leading-[1.7]" role="status">{t("Bank details will be displayed once the donation account is confirmed.")}</p>}
    <div className="grid gap-5">
      <div className="grid content-start gap-2">
        <label className="text-sm font-bold" htmlFor="funder-amount">{t("Amount paid (LKR)")}</label>
        <div className="flex items-center overflow-hidden rounded-xl border border-[#8cb7ab] bg-white focus-within:ring-2 focus-within:ring-[#007667] dark:border-[#578e83] dark:bg-[#12382f]">
          <span className="px-4 text-xs font-bold tracking-wider text-[#56756b] dark:text-[#b2d3c7]">LKR</span>
          <input className="min-w-0 flex-1 border-0 bg-transparent py-3.5 pr-4 text-lg font-semibold outline-none focus-visible:outline-none" id="funder-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required />
        </div>
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <label className="text-sm font-bold" htmlFor="funder-receipt">{t("Payment receipt")}</label>
        <div className="relative flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#89b2a7] bg-[#edf7f2] px-5 py-6 text-center transition-colors hover:border-[#007667] hover:bg-[#e1f1e9] has-focus-visible:ring-2 has-focus-visible:ring-[#007667] dark:border-[#578e83] dark:bg-[#163d33] dark:hover:bg-[#1d4b3e]">
          <span className="grid size-10 place-items-center rounded-full bg-[#d4eade] text-[#007667] dark:bg-[#2e5e4a] dark:text-[#b4f3d5]" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg></span>
          <span className="max-w-full break-all text-sm font-semibold">{receipt ? receipt.name : t("Choose your receipt")}</span>
          <span className="text-xs text-[#56756b] dark:text-[#b2d3c7]">JPG, PNG, WebP, PDF · 5 MB</span>
          <input ref={fileRef} className="absolute inset-0 size-full cursor-pointer opacity-0" id="funder-receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={selectReceipt} aria-invalid={Boolean(error)} aria-describedby="funder-receipt-hint funder-receipt-error" />
        </div>
        <p id="funder-receipt-hint" className="sr-only">{t("Choose a JPG, PNG, WebP or PDF receipt, up to 5 MB.")}</p>
      </div>
    </div>
    </div>
    <p id="funder-receipt-error" className="mt-2 text-sm text-red-800 dark:text-red-200" role="alert">{error && t(error)}</p>
    {receipt && <div className="mt-4 grid justify-items-start gap-3">
      {receipt.type.startsWith("image/") && <ReceiptPreview file={receipt} />}
      <p className="max-w-full break-all text-sm">{receipt.name}</p>
      <button type="button" className="rounded-lg border border-[#6d9d91] px-3 py-2 text-sm" onClick={() => { setReceipt(null); fileRef.current.value = ""; }}>{t("Remove receipt")}</button>
    </div>}
  </fieldset>;
}
