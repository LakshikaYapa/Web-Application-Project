import { useLanguage } from "../i18n/useLanguage";
import FloodReportForm from "./FloodReportForm";

const reportSteps = [
  { number: "01", title: "Where is the flooding?", description: "Share the nearest town and landmarks so the location is easy to identify." },
  { number: "02", title: "What can you see?", description: "Describe the flooding and how it is affecting roads, homes or your community." },
  { number: "03", title: "Add a clearer picture", description: "Photos can help explain the situation. Only take them from a safe location." },
];

export default function FloodReportPage() {
  const { t } = useLanguage();

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-6 min-[761px]:px-6 min-[761px]:py-10">
      <a href="/" className="mb-5 inline-block font-semibold text-[#007e8d] hover:underline dark:text-[#99e4c9]">← {t("Back to homepage")}</a>
      <section aria-labelledby="report-title" className="grid gap-8 rounded-[20px] border border-[#79b5af] bg-linear-[120deg,#c9e9e0,#c9e3ec] p-6 min-[761px]:grid-cols-[1.4fr_1fr] min-[761px]:p-10 dark:border-[#4b817b] dark:bg-linear-[120deg,#163f3b,#173344]">
        <div>
          <p className="text-sm font-bold tracking-wide text-[#00685b] dark:text-[#99e4c9]">{t("Share what you see")}</p>
          <h1 id="report-title" className="my-4 text-[clamp(32px,4vw,48px)] leading-tight font-bold">{t("Report a flood")}</h1>
          <p className="max-w-xl leading-8">{t("Help your community understand local flooding by sharing what is happening in your area.")}</p>
        </div>
        <aside className="rounded-2xl border border-[#438c8b] bg-[#104657] p-6 text-white">
          <svg className="mb-4 h-10 w-10 text-[#9de5dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 17h.01" />
          </svg>
          <h2 className="mb-3 text-xl font-bold">{t("Your safety comes first")}</h2>
          <p className="leading-7 text-[#e0f4f5]">{t("Stay away from floodwater. Share only what you can observe safely, without putting yourself or others at risk.")}</p>
        </aside>
      </section>
      <section aria-labelledby="report-details-title" className="mt-9">
        <h2 id="report-details-title" className="text-2xl font-bold">{t("Details that help others")}</h2>
        <ol className="mt-5 grid list-none gap-5 p-0 min-[761px]:grid-cols-3">
          {reportSteps.map((step) => (
            <li key={step.number} className="rounded-2xl border border-[#73aaa3] bg-[#d4eae3] p-6 dark:border-[#578e83] dark:bg-[#1c443e]">
              <span aria-hidden="true" className="inline-block rounded-lg bg-[#a8d5c5] px-3 py-2 font-bold text-[#005849] dark:bg-[#31685c] dark:text-[#e1fff1]">{step.number}</span>
              <h3 className="mt-4 mb-2 text-lg font-bold">{t(step.title)}</h3>
              <p className="leading-7">{t(step.description)}</p>
            </li>
          ))}
        </ol>
      </section>
      <FloodReportForm />
    </main>
  );
}
