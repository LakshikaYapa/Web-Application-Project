import { useLanguage } from "../i18n/useLanguage";
import "./VolunteerPage.css";
import VolunteerForm from "./VolunteerForm";

const waysToHelp = [
  { number: "01", title: "Relief distribution", description: "Help organise and distribute food, drinking water and essential supplies." },
  { number: "02", title: "Transport support", description: "Support local teams with the transport of relief supplies." },
  { number: "03", title: "Community support", description: "Help at shelters and support families in your community." },
];

export default function VolunteerPage() {
  const { t } = useLanguage();
  return <main id="main" className="volunteer-page" tabIndex={-1}>
    <a className="help-back" href="/">← {t("Back to homepage")}</a>
    <section className="volunteer-page-intro" aria-labelledby="volunteer-page-title">
      <div>
        <p className="volunteer-page-eyebrow">{t("Together for our communities")}</p>
        <h1 id="volunteer-page-title">{t("Your time can make a difference.")}</h1>
        <p className="volunteer-page-description">{t("Support communities affected by floods. Explore ways to offer your time and skills through FloodGuard.")}</p>
        <a className="volunteer-explore" href="#volunteer-ways">{t("Explore ways to help")} <span aria-hidden="true">↓</span></a>
      </div>
      <div className="volunteer-page-message">
        <span className="volunteer-heart" aria-hidden="true">♡</span>
        <h2>{t("Small actions. Meaningful support.")}</h2>
        <p>{t("Every helping hand starts with a willingness to care.")}</p>
      </div>
    </section>
    <section id="volunteer-ways" className="volunteer-ways" aria-labelledby="volunteer-ways-title">
      <h2 id="volunteer-ways-title">{t("How you can help")}</h2>
      <p>{t("Choose one or more areas that match your skills.")}</p>
      <ul className="volunteer-ways-grid">{waysToHelp.map((way) => <li key={way.number}>
        <span className="volunteer-way-number" aria-hidden="true">{way.number}</span>
        <h3>{t(way.title)}</h3><p>{t(way.description)}</p>
      </li>)}</ul>
    </section>
    <VolunteerForm />
  </main>;
}
