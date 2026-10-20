/** Canonical colour mapping so every portal renders the same status the same way. */
const TONES = {
  /* delivery / generic */
  planning: 'neutral',
  'in-progress': 'info',
  review: 'warn',
  done: 'ok',
  active: 'ok',
  inactive: 'neutral',
  archived: 'neutral',

  /* tasks */
  todo: 'neutral',
  blocked: 'error',

  /* tickets */
  open: 'info',
  waiting: 'warn',
  'waiting-on-us': 'warn',
  resolved: 'ok',
  closed: 'neutral',

  /* leaves */
  pending: 'warn',
  approved: 'ok',
  rejected: 'error',
  cancelled: 'neutral',

  /* invoices */
  paid: 'ok',
  overdue: 'error',
  unpaid: 'warn',
  draft: 'neutral',

  /* inquiries */
  new: 'info',
  contacted: 'warn',
  qualified: 'ok',

  /* priorities */
  low: 'neutral',
  medium: 'info',
  high: 'warn',
  urgent: 'error',

  /* project status */
  completed: 'ok',
  on_hold: 'warn',
  'on-hold': 'warn',
};

export function toneFor(value) {
  if (!value) return 'neutral';
  return TONES[String(value).toLowerCase()] || 'neutral';
}

/** Small pill showing a record's status/priority. */
export default function StatusBadge({ value, tone, label }) {
  const resolved = tone || toneFor(value);
  const text = label || String(value || '—').replace(/-/g, ' ');

  return <span className={`badge badge--${resolved}`}>{text}</span>;
}
