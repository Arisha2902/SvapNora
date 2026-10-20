/**
 * Reusable section header: purple eyebrow label (optional square bullet)
 * + large title (may contain JSX for purple highlighted phrases) + optional intro.
 */
export default function SectionHeader({ eyebrow, title, intro, bullet = false }) {
  return (
    <header className="section-head reveal">
      {eyebrow && (
        <p className="eyebrow">
          {bullet && <span className="eyebrow__bullet" aria-hidden="true" />}
          {eyebrow}
        </p>
      )}
      <h2 className="section-title">{title}</h2>
      {intro && <p className="section-intro">{intro}</p>}
    </header>
  );
}
