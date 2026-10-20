/**
 * Service card � flat grey card with icon tile, bold title,
 * description and a purple ">" link. Purple top border on hover.
 * Icon tile: black on mobile, white square on desktop (CSS).
 */
export default function ServiceCard({ icon: Icon, title, text, link }) {
  return (
    <article className="service-card reveal">
      <span className="service-card__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <a href="#contact" className="service-card__link">
        {link}
        <span className="arrow" aria-hidden="true">
          &gt;
        </span>
      </a>
    </article>
  );
}
