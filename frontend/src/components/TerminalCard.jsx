/**
 * Reusable terminal-style visual card.
 * Dark panel with 3 window dots, mono title, right-aligned tag,
 * body content (full diagram on desktop, simplified on mobile),
 * a mono footer row, and an optional caption under the card.
 */
export default function TerminalCard({
  title,
  tag,
  body,
  mobileBody,
  footLeft,
  footRight,
  footRightOk = false,
  caption,
}) {
  return (
    <div className="term">
      <div className="term__bar">
        <span className="term__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="term__title">{title}</span>
        <span className="term__tag">{tag}</span>
      </div>

      <div className="term__body">
        <div className="term__desktop">{body}</div>
        <div className="term__mobile">{mobileBody}</div>
      </div>

      <div className="term__foot">
        <span>{footLeft}</span>
        <span className={footRightOk ? 'ok' : undefined}>{footRight}</span>
      </div>

      {caption && (
        <p className="term__caption">
          <span>{caption[0]}</span>
          <span>{caption[1]}</span>
        </p>
      )}
    </div>
  );
}
