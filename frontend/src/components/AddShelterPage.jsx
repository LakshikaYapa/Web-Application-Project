import { useLanguage } from "../i18n/useLanguage";

const inputClass = "mt-2 w-full rounded-xl border border-[#73aaa3] bg-white px-4 py-3 outline-none focus:border-[#007e8d] focus:ring-2 focus:ring-[#007e8d]/30 dark:border-[#578e83] dark:bg-[#12343d]";

export default function AddShelterPage() {
  const { t } = useLanguage();

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-6 min-[761px]:px-6 min-[761px]:py-10">
      <a href="/" className="mb-5 inline-block font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Back to homepage")}</a>
      <section aria-labelledby="add-shelter-title" className="rounded-[20px] border border-[#79b5af] bg-linear-[120deg,#c9e9e0,#c9e3ec] p-6 min-[761px]:p-10 dark:border-[#4b817b] dark:bg-linear-[120deg,#163f3b,#173344]">
        <p className="text-sm font-bold tracking-wide text-[#00685b] dark:text-[#99e4c9]">{t("Support our communities")}</p>
        <h1 id="add-shelter-title" className="my-4 text-[clamp(32px,4vw,48px)] leading-tight font-bold">{t("Add a shelter")}</h1>
        <p className="max-w-2xl leading-8">{t("Share shelter details to help families find a place to stay during flooding.")}</p>
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
        </form>
      </section>
    </main>
  );
}
