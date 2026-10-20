/** Friendly zero-data / zero-result state. */
export default function EmptyState({ title = 'Nothing here yet', body, action, icon }) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">
        {icon || '∅'}
      </span>
      <h3 className="empty__title">{title}</h3>
      {body && <p className="empty__body">{body}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
