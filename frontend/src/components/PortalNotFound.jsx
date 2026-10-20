import { Helmet } from 'react-helmet-async';

import Button from './Button.jsx';

/** 404 inside a portal - points back at that portal's dashboard, never the public site. */
export default function PortalNotFound({ portal = 'Portal', base = 'admin' }) {
  return (
    <section className="portal-404">
      <Helmet>
        <title>Not found · {portal} · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <p className="eyebrow">
        <span className="eyebrow__bullet" aria-hidden="true" />
        Error 404
      </p>
      <h1 className="notfound__code">404</h1>
      <p className="notfound__text">That {portal.toLowerCase()} page does not exist, moved, or was never created.</p>
      <div className="notfound__actions">
        <Button to={`/${base}/dashboard`} variant="primary">
          Back to {portal} home
        </Button>
      </div>
    </section>
  );
}
