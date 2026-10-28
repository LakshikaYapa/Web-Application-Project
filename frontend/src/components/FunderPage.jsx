import { useLanguage } from "../i18n/useLanguage";
import FunderForm from "./FunderForm";

const supportWays = [
  { number: "01", title: "Food and drinking water", description: "Help provide meals, dry food and clean drinking water for affected families." },
  { number: "02", title: "Shelter essentials", description: "Support families with bedding, hygiene items and other everyday essentials." },
  { number: "03", title: "Relief operations", description: "Help local teams organise and transport supplies to communities in need." },
];

export default function FunderPage() {
  const { t } = useLanguage();
  return <main id="main" className="mx-auto max-w-[1180px] px-4 pt-6 pb-10 min-[761px]:px-6 min-[761px]:pt-[30px] min-[761px]:pb-14" tabIndex={-1}>
    <a className="mb-4 inline-block text-[#007e8d] dark:text-[#99e4c9]" href="/">← {t("Back to homepage")}</a>
    <a className="mb-4 ml-6 inline-block font-semibold text-[#007667] hover:underline dark:text-[#99e4c9]" href="/my-contributions">{t("My contributions")}</a>
    <section className="grid items-center gap-6 rounded-[20px] border border-[#79b5af] bg-linear-[120deg,#c9e9e0,#c9e3ec] p-6 min-[761px]:grid-cols-[1.4fr_1fr] min-[761px]:gap-10 min-[761px]:p-10 dark:border-[#4b817b] dark:bg-linear-[120deg,#163f3b,#173344] [&_h1]:my-4 [&_h1]:max-w-[570px] [&_h1]:text-[clamp(32px,4vw,48px)] [&_h1]:leading-[1.2] [&_h1]:tracking-[-.03em]" aria-labelledby="funder-title">
      <div>
        <p className="text-[13px] font-bold tracking-[.08em] text-[#00685b] dark:text-[#99e4c9]">{t("Support our communities")}</p>
        <h1 id="funder-title">{t("Help families rebuild, together.")}</h1>
        <p className="max-w-[540px] leading-[1.8]">{t("Explore ways to support flood relief and help communities recover through FloodGuard.")}</p>
        <a className="mt-3.5 inline-flex items-center gap-[18px] rounded-lg bg-[#007667] px-5 py-[13px] font-bold text-white hover:bg-[#005e53]" href="#funder-support">{t("Explore ways to support")} <span aria-hidden="true">↓</span></a>
      </div>
      <aside className="flex min-h-[400px] flex-col justify-end rounded-2xl border border-[#33877e] bg-[linear-gradient(180deg,rgba(5,27,26,.05)_20%,rgba(5,27,26,.7)_60%,rgba(5,27,26,.95)_100%),url('/funder-background.jpg')] bg-cover bg-position-[center_45%] bg-no-repeat p-6 text-white min-[761px]:min-h-[440px] min-[761px]:p-[30px] [&_h2]:my-3 [&_h2]:text-[26px] [&_h2]:leading-[1.4] [&_p]:mb-0 [&_p]:leading-[1.8]">
        <span className="text-5xl leading-none text-[#c5f5df]" aria-hidden="true">♡</span>
        <h2>{t("Care that reaches communities.")}</h2>
        <p>{t("Food, shelter essentials and relief supplies can help families take their next step.")}</p>
      </aside>
    </section>
    <section id="funder-support" className="mt-10 scroll-mt-6 [&>h2]:mb-2 [&>h2]:text-[28px]" aria-labelledby="funder-support-title">
      <h2 id="funder-support-title">{t("Ways your support can help")}</h2>
      <p>{t("Discover the areas you could support.")}</p>
      <ul className="my-6 grid list-none gap-5 p-0 min-[761px]:grid-cols-3 [&>li]:rounded-[14px] [&>li]:border [&>li]:border-[#73aaa3] [&>li]:bg-[#d4eae3] [&>li]:p-6 [&>li]:shadow-[0_4px_12px_rgb(15_64_82/8%)] [&_h3]:mb-2.5 [&_h3]:text-lg [&_p]:m-0 [&_p]:leading-[1.7] dark:[&>li]:border-[#578e83] dark:[&>li]:bg-[#1c443e]">{supportWays.map((way) => <li key={way.number}>
        <span className="inline-block rounded-lg bg-[#a8d5c5] px-2.5 py-2 font-bold text-[#005849] dark:bg-[#31685c] dark:text-[#e1fff1]" aria-hidden="true">{way.number}</span>
        <h3>{t(way.title)}</h3><p>{t(way.description)}</p>
      </li>)}</ul>
    </section>
    <p className="mt-7 text-sm leading-[1.7]">{t("Use the form below to submit your contribution details.")}</p>
    <FunderForm />
  </main>;
}
