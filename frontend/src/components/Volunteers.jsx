import { useLanguage } from "../i18n/useLanguage";

const waysToHelp = [
  { title: "Volunteers", image: "/community/food-packing.png", alt: "People packing colorful bags of food supplies around long tables indoors", description: "Give your time and skills to help communities recover.", action: "Become a volunteer", href: "/volunteer" },
  { title: "Donators", image: "/community/supplies-distribution.png", alt: "Bags of groceries arranged on tables beneath outdoor canopies", description: "Give funds or essential supplies to support families in need.", action: "Make a contribution", href: "/funder" },
];

export default function Volunteers() {
  const { t } = useLanguage();
  return <section className="volunteers-section" aria-labelledby="volunteers-title">
    <div className="volunteers-heading"><div><h2 id="volunteers-title">{t("Volunteers and donators")}</h2><p>{t("Different ways to help. One caring community.")}</p></div></div>
    <ul className="mt-6 grid list-none gap-6 p-0 min-[761px]:grid-cols-2">{waysToHelp.map((way) => <li key={way.title} className="overflow-hidden rounded-2xl border border-[#79b5af] bg-[#edf6f2] shadow-[0_8px_24px_rgb(15_64_82/10%)] dark:border-[#416f68] dark:bg-[#173b43]">
      <img src={way.image} alt={t(way.alt)} width="640" height="480" loading="lazy" decoding="async" className="h-60 w-full object-cover min-[761px]:h-72" />
      <div className="p-6 min-[761px]:p-8"><h3 className="text-2xl font-bold">{t(way.title)}</h3><p className="mt-3 leading-7">{t(way.description)}</p><a href={way.href} className="mt-5 inline-flex items-center gap-5 rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white hover:bg-[#005e6b]">{t(way.action)} <span aria-hidden="true">→</span></a></div>
    </li>)}</ul>
  </section>;
}
