import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import Spinner from './ui/Spinner.jsx';

/**
 * Hands the browser over to one of the pre-built static pages in /public
 * (services.html, products.html, about.html, ...).
 *
 * This has to be a real document navigation - a client-side router cannot
 * render a static file, so `location.replace` performs the load and keeps the
 * SPA entry out of the history stack (Back returns to where you came from).
 */
export default function StaticRedirect({ to, label }) {
  useEffect(() => {
    const timer = setTimeout(() => window.location.replace(to), 50);
    return () => clearTimeout(timer);
  }, [to]);

  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <Helmet>
        <title>{label} · SvapNora</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Spinner label={`Opening ${label}`} />
      <span>Opening {label}…</span>
      <a className="auth__link" href={to}>
        Continue to {label}
      </a>
    </div>
  );
}
