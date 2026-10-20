export const TONES = {
  error: 'alert--error',
  success: 'alert--success',
  info: 'alert--info',
  warning: 'alert--warning',
};

/** Inline message block used for form errors, banners and API failures. */
export default function Alert({ tone = 'info', title, children, className = '', onClose }) {
  return (
    <div
      className={`alert ${TONES[tone] || TONES.info}${className ? ` ${className}` : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div className="alert__body">
        {title && <strong className="alert__title">{title}</strong>}
        {children && <p className="alert__text">{children}</p>}
      </div>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
