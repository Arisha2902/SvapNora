import {
  IconBriefcase,
  IconBuilding,
  IconRocket,
  IconStore,
  IconTrending,
} from '../icons.jsx';

const AUDIENCES = [
  {
    icon: IconRocket,
    title: 'Startups and founders',
    text: 'Turn product ideas and operational needs into working software.',
  },
  {
    icon: IconStore,
    title: 'Small and medium-sized businesses',
    text: 'Organize workflows and reduce repetitive administrative work.',
  },
  {
    icon: IconBriefcase,
    title: 'Service-based businesses',
    text: 'Improve lead management, customer communication, and day-to-day coordination.',
  },
  {
    icon: IconTrending,
    title: 'Growing teams',
    text: 'Develop internal tools and systems that support more structured operations.',
  },
  {
    icon: IconBuilding,
    title: 'Established organizations',
    text: 'Explore custom integrations and software improvements that fit existing processes.',
  },
];

/**
 * Who We Serve � light grey section. Five rows with thin dividers (title left,
 * description middle, purple ">" right; rows lift on hover). On mobile each
 * row becomes a white tile with a purple line icon, title and ">".
 */
export default function WhoWeServe() {
  return (
    <section className="section section--grey" id="who-we-serve">
      <div className="container">
        <header className="section-head reveal">
          <h2 className="section-title">
            Technology for Businesses at Every Stage
          </h2>
          <p className="section-intro">
            We aim to help organizations that want to improve their operations through
            thoughtfully developed digital solutions.
          </p>
        </header>

        <div className="serve-list">
          {AUDIENCES.map((a) => (
            <a key={a.title} href="#contact" className="serve-row reveal">
              <span className="serve-row__icon" aria-hidden="true">
                <a.icon size={18} />
              </span>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
              <span className="serve-row__chev" aria-hidden="true">
                &gt;
              </span>
            </a>
          ))}
        </div>

        <blockquote className="serve-quote reveal">
          Every business has different requirements. We believe the right solution starts with
          understanding those requirements rather than forcing every client into the same product.
        </blockquote>
      </div>
    </section>
  );
}
