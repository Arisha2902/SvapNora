import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Button from '../components/Button.jsx';

export default function NotFound() {
  return (
    <section className="section section--dark notfound">
      <div className="container">
        <Helmet>
          <title>Page not found · SvapNora</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <p className="eyebrow">
          <span className="eyebrow__bullet" aria-hidden="true" />
          Error 404
        </p>
        <h1 className="notfound__code">404</h1>
        <p className="notfound__text">
          The page you asked for does not exist, moved, or was never published.
        </p>
        <div className="notfound__actions">
          <Button to="/" variant="primary">
            Back to home
          </Button>
          <Button to="/products" variant="ghost">
            Browse our products
          </Button>
          <Link className="notfound__link" to="/contact">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
