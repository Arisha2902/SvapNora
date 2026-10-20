import { Link } from 'react-router-dom';

/**
 * Reusable button/CTA.
 * variant: 'primary' (solid purple) | 'ghost' (transparent, 1px outline) | 'white'
 * Renders a react-router <Link> when `to` is given, a plain <a> when `href` is
 * given, otherwise a <button>.
 * Structure: label + ">" arrow (arrow nudges right on hover via CSS).
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  className = '',
  children,
  onClick,
  type = 'button',
  ariaLabel,
  disabled,
}) {
  const cls = `btn btn--${variant}${className ? ` ${className}` : ''}${disabled ? ' is-disabled' : ''}`;
  const inner = (
    <>
      <span className="btn__label">{children}</span>
      <span className="btn__arrow" aria-hidden="true">
        &gt;
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} aria-label={ariaLabel} disabled={disabled}>
      {inner}
    </button>
  );
}
