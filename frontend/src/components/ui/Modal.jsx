import { useEffect } from 'react';
import { IconClose } from '../icons.jsx';

/**
 * Generic modal. Renders inline (no portal) so it stays inside the surrounding
 * layout context; the backdrop is fixed. Escape and backdrop clicks close it.
 */
export default function Modal({ open, onClose, title, subtitle, size = 'md', children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <button className="modal__scrim" onClick={onClose} aria-label="Close dialog" tabIndex={-1} />
      <div className={`modal__panel modal__panel--${size}`}>
        <header className="modal__head">
          <div>
            {title && <h2 className="modal__title">{title}</h2>}
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}
