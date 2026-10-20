/**
 * Why-Us feature card � dark grey card with big purple number (01-06),
 * bold title and grey body. `special` variant adds the purple border,
 * soft glow, "SIGNATURE INITIATIVE" tag and a code box.
 */
export default function FeatureCard({ num, title, text, special = false, tag, tagShort, code }) {
  return (
    <article className={`feature-card reveal${special ? ' feature-card--special' : ''}`}>
      {special && (
        <span className="feature-card__tag">
          <span className="short">{tagShort}</span>
          <span className="full">{tag}</span>
        </span>
      )}
      <span className="feature-card__num">{num}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {code && (
        <div className="code-box">
          <pre className="code">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </article>
  );
}
