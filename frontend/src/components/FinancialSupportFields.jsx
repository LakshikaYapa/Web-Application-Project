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

const inputClass = "w-full min-w-0 rounded-lg border border-[#6d9d91] bg-[#f5fbf8] p-3 dark:border-[#578e83] dark:bg-[#12382f]";

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

  return <fieldset className="col-span-full min-w-0 rounded-xl border border-[#73aaa3] bg-[#edf7f1] p-5 dark:border-[#578e83] dark:bg-[#12382f]">
    <legend className="px-2 font-bold">{t("Financial support")}</legend>
    {bankReady ? <>
      <p className="mb-4 leading-[1.7]">{t("Transfer your contribution to the bank account below, then enter the amount paid and attach your receipt.")}</p>
      <dl className="mb-5 grid gap-3 rounded-lg border border-[#73aaa3] p-4 min-[540px]:grid-cols-2">
        {[["Bank", donationBank.bankName], ["Branch", donationBank.branch], ["Account holder", donationBank.accountName], ["Account number", donationBank.accountNumber]].map(([label, value]) => <div key={label}>
          <dt className="text-sm font-bold">{t(label)}</dt><dd className="mt-1 break-all">{value}</dd>
        </div>)}
      </dl>
    </> : <p className="mb-5 leading-[1.7]" role="status">{t("Bank details will be displayed once the donation account is confirmed.")}</p>}
    <div className="grid gap-5 min-[761px]:grid-cols-2">
      <div className="grid content-start gap-2">
        <label className="text-sm font-bold" htmlFor="funder-amount">{t("Amount paid (LKR)")}</label>
        <input className={inputClass} id="funder-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <label className="text-sm font-bold" htmlFor="funder-receipt">{t("Payment receipt")}</label>
        <input ref={fileRef} className={inputClass} id="funder-receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={selectReceipt} aria-invalid={Boolean(error)} aria-describedby="funder-receipt-hint funder-receipt-error" />
        <p id="funder-receipt-hint" className="text-[13px] leading-[1.6]">{t("Choose a JPG, PNG, WebP or PDF receipt, up to 5 MB.")}</p>
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
