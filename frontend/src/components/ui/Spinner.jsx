/** Small indeterminate spinner. `size` is px, `label` is announced to screen readers. */
export default function Spinner({ size = 22, label = 'Loading', className = '' }) {
  return (
    <span
      className={`spinner${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}
