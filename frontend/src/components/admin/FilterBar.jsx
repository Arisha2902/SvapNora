import { useEffect, useRef, useState } from 'react';

/**
 * Search + filter strip used above every admin table.
 * `value` is debounced by `delay` ms so typing does not hammer the API.
 */
export default function FilterBar({ value = '', onChange, placeholder = 'Search…', children, onRefresh, busy }) {
  const [local, setLocal] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 350);
    return () => clearTimeout(t);
  }, [local, value, onChange]);

  return (
    <div className="filter-bar">
      <div className="filter-bar__search">
        <input
          type="search"
          value={local}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>
      {children}
      {onRefresh && (
        <button type="button" className="filter-bar__refresh" onClick={onRefresh} disabled={busy}>
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
    </div>
  );
}

/** Labeled input used inside modals and side panels. */
export function Field({ label, required, hint, error, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Standard select bound to a string value. */
export function Select({ value, onChange, options, ariaLabel }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
