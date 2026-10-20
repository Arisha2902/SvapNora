import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Alert from '../ui/Alert.jsx';

/**
 * Shared frame for the three sign-in screens. Each portal renders its own form
 * inside this card; the frame only supplies branding, error display and the
 * link back to the public site.
 */
export default function AuthCard({ title, subtitle, portal, noindex = true, error, notice, children, footer }) {
  return (
    <div className={`auth auth--${portal}`}>
      <Helmet>
        <title>{title} · SvapNora</title>
        <meta name="description" content={subtitle} />
        {noindex && (
          <>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="googlebot" content="noindex, nofollow" />
          </>
        )}
      </Helmet>

      <div className="auth__panel">
        <Link to="/" className="auth__brand" aria-label="SvapNora — home">
          SvapNora<span className="logo-chevron">&gt;</span>
        </Link>

        <div className="auth__head">
          <p className="eyebrow">
            <span className="eyebrow__bullet" aria-hidden="true" />
            {portal === 'admin' ? 'Private' : portal === 'employee' ? 'Team' : 'Client'} access
          </p>
          <h1 className="auth__title">{title}</h1>
          <p className="auth__sub">{subtitle}</p>
        </div>

        {notice && <Alert tone="info">{notice}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}

        {children}

        {footer && <div className="auth__foot">{footer}</div>}
      </div>

      <p className="auth__legal">
        Authenticated sessions are issued as httpOnly cookies scoped to this portal only.
      </p>
    </div>
  );
}
