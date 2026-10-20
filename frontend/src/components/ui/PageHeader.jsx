/** Page-level heading: eyebrow, H1, description and optional action buttons. */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-head">
      <div className="page-head__text">
        {eyebrow && (
          <p className="eyebrow">
            <span className="eyebrow__bullet" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="page-head__title">{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}
