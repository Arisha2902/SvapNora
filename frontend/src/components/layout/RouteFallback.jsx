import Spinner from '../ui/Spinner.jsx';

/** Full-viewport loader used while a lazy route chunk is on its way. */
export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <Spinner label="Loading" />
    </div>
  );
}
