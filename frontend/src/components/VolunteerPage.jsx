import { useLanguage } from "../i18n/useLanguage";
import VolunteerForm from "./VolunteerForm";

const waysToHelp = [
  { number: "01", title: "Relief distribution", description: "Help organise and distribute food, drinking water and essential supplies." },
  { number: "02", title: "Transport support", description: "Support local teams with the transport of relief supplies." },
  { number: "03", title: "Community support", description: "Help at shelters and support families in your community." },
];

export default function VolunteerPage() {
  const { t } = useLanguage();
  return <main id="main" className="mx-auto max-w-[1180px] px-4 pt-6 pb-10 min-[761px]:px-6 min-[761px]:pt-[30px] min-[761px]:pb-14 [&_h1]:my-4 [&_h1]:max-w-[560px] [&_h1]:text-[clamp(32px,4vw,48px)] [&_h1]:leading-[1.2] [&_h1]:tracking-[-.03em]" tabIndex={-1}>
    <a className="mb-4 inline-block text-[#007e8d] dark:text-[#87e1db]" href="/">← {t("Back to homepage")}</a>
    <section className="grid items-center gap-6 rounded-[20px] border border-[#76b6bf] bg-linear-[120deg,#c9e9e5,#c5e0ee] p-6 min-[761px]:grid-cols-[1.4fr_1fr] min-[761px]:gap-12 min-[761px]:p-10 dark:border-[#315969] dark:bg-linear-[120deg,#133a43,#163043]" aria-labelledby="volunteer-page-title">
      <div>
        <p className="text-[13px] font-bold tracking-[.08em] text-[#006f79] dark:text-[#87e1db]">{t("Together for our communities")}</p>
        <h1 id="volunteer-page-title">{t("Your time can make a difference.")}</h1>
        <p className="max-w-[540px] leading-[1.8]">{t("Support communities affected by floods. Explore ways to offer your time and skills through FloodGuard.")}</p>
        <a className="mt-3.5 inline-flex items-center gap-[18px] rounded-lg bg-[#007e8d] px-5 py-[13px] font-bold text-white hover:bg-[#006776]" href="#volunteer-ways">{t("Explore ways to help")} <span aria-hidden="true">↓</span></a>
      </div>
      <div className="flex min-h-[400px] flex-col justify-end rounded-2xl bg-[linear-gradient(180deg,rgba(5,27,39,.05)_25%,rgba(5,27,39,.7)_65%,rgba(5,27,39,.95)_100%),url('/volunteer-background.jpg')] bg-cover bg-position-[center_45%] bg-no-repeat p-5 text-white min-[761px]:min-h-[440px] min-[761px]:p-7 [&_h2]:my-3 [&_h2]:text-2xl [&_h2]:leading-[1.4] [&_p]:m-0 [&_p]:leading-[1.7]">
        <span className="text-5xl leading-none text-[#c4f8f1]" aria-hidden="true">♡</span>
        <h2>{t("Small actions. Meaningful support.")}</h2>
        <p>{t("Every helping hand starts with a willingness to care.")}</p>
      </div>
    </section>
    <section id="volunteer-ways" className="mt-10 scroll-mt-6 [&_h2]:mb-2 [&_h2]:text-[28px]" aria-labelledby="volunteer-ways-title">
      <h2 id="volunteer-ways-title">{t("How you can help")}</h2>
      <p>{t("Choose one or more areas that match your skills.")}</p>
      <ul className="my-6 grid list-none gap-5 p-0 min-[761px]:grid-cols-3 [&>li]:rounded-[14px] [&>li]:border [&>li]:border-[#73aeb9] [&>li]:bg-[#d9ecef] [&>li]:p-6 [&>li]:shadow-[0_4px_12px_rgb(15_64_82/8%)] [&_h3]:mb-2.5 [&_h3]:text-lg [&_p]:m-0 [&_p]:leading-[1.7] dark:[&>li]:border-[#578d9d] dark:[&>li]:bg-[#1c4250]">{waysToHelp.map((way) => <li key={way.number}>
        <span className="inline-block rounded-lg bg-[#add9d3] px-2.5 py-2 font-bold text-[#00545e] dark:bg-[#32676c] dark:text-[#e1fffa]" aria-hidden="true">{way.number}</span>
        <h3>{t(way.title)}</h3><p>{t(way.description)}</p>
      </li>)}</ul>
    </section>
    <VolunteerForm />
  </main>;
}
