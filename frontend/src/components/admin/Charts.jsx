/** CSS/SVG-free bar chart for weekly counts - no chart library needed. */
export function BarChart({ points = [], unit = 'inquiries' }) {
  const max = Math.max(1, ...points.map((p) => p.count));

  return (
    <div className="chart">
      <div className="chart__bars" role="img" aria-label={`${unit} per week`}>
        {points.map((p) => (
          <div className="chart__col" key={p.weekStart}>
            <span className="chart__value">{p.count}</span>
            <div className="chart__bar" style={{ height: `${Math.max(4, (p.count / max) * 100)}%` }} />
            <span className="chart__label">{p.label}</span>
          </div>
        ))}
      </div>
      <p className="chart__caption">Last 8 weeks · {unit}</p>
    </div>
  );
}

/** Horizontal share-of-total rows used for status breakdowns. */
export function Breakdown({ rows = [], labelMap = {} }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;

  return (
    <div className="breakdown">
      {rows.map((r) => {
        const key = r.status ?? r._id ?? 'unknown';
        const pct = Math.round((r.count / total) * 100);
        return (
          <div className="breakdown__row" key={key}>
            <div className="breakdown__head">
              <span className="breakdown__name">{labelMap[key] || key}</span>
              <span className="breakdown__count">
                {r.count} <small>({pct}%)</small>
              </span>
            </div>
            <div className="breakdown__track">
              <div className="breakdown__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
