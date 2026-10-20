/** Compact metric tile used across all three dashboards. */
export default function StatCard({ label, value, hint, tone = 'neutral', icon }) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        {icon && (
          <span className="stat__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="stat__value">{value}</p>
      {hint && <p className="stat__hint">{hint}</p>}
    </div>
  );
}
