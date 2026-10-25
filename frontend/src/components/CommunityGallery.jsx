import { useLanguage } from "../i18n/useLanguage";
const activities = [
  {
    image: "/community/food-packing.png",
    title: "Preparing food parcels together",
    description: "People working together to pack food and essential supplies.",
    alt: "People packing colorful bags of food supplies around long tables indoors",
  },
  {
    image: "/community/supplies-distribution.png",
    title: "Organizing essential supplies",
    description: "Community members organizing bags of supplies for distribution.",
    alt: "Bags of groceries arranged on tables beneath outdoor canopies",
  },
  {
    image: "/community/water-distribution.png",
    title: "Sharing water and support",
    description: "Relief workers supporting a community with water supplies.",
    alt: "A relief worker and children gathered beside water containers",
  },
];

export default function CommunityGallery() {
  const { t } = useLanguage();
  return (
    <section className="community-gallery" aria-labelledby="community-gallery-title">
      <div className="volunteers-heading">
        <div>
          <h2 id="community-gallery-title">{t("Community in action")}</h2>
          <p>{t("People coming together to support communities.")}</p>
        </div>
        <div className="volunteers-actions">
          <button type="button" disabled aria-describedby="community-gallery-note">{t("View more photos")}<span aria-hidden="true">→</span></button>
        </div>
      </div>
      <ul className="community-gallery-grid">
        {activities.map(({ image, title, description, alt }) => (
          <li className="community-photo-card" key={image}>
            <figure>
              <img src={image} alt={t(alt)} width="640" height="480" loading="lazy" decoding="async" />
              <figcaption>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="volunteers-note" id="community-gallery-note">{t("Community relief photos provided for this gallery. Locations and dates have not been verified. More photos coming soon.")}</p>
    </section>
  );
}
