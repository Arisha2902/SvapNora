import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { getSettings } from '../../services/adminService.js';

const prettify = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const formatValue = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Enabled' : 'Disabled';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/** Read-only view of the platform configuration returned by GET /admin/settings. */
export default function AdminSettings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getSettings()
      .then((res) => {
        if (alive) setData(res?.data);
      })
      .catch((err) => {
        if (alive) setError(err?.message || 'Could not load settings.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const groups = Object.entries(data || {}).filter(([, v]) => typeof v !== 'function');

  return (
    <>
      <Helmet>
        <title>Settings · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Platform configuration as reported by the API. Changing values here requires a backend change."
      />

      {loading && (
        <div className="route-fallback" role="status">
          <Spinner label="Loading settings" />
          <span>Loading settings…</span>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && groups.length === 0 && (
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">
            ∅
          </span>
          <h3 className="empty__title">No settings exposed</h3>
          <p className="empty__body">This environment does not publish a settings payload.</p>
        </div>
      )}

      {groups.length > 0 && (
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Configuration</h2>
          </header>
          <dl className="kv-grid">
            {groups.map(([k, v]) => (
              <div className="kv" key={k}>
                <dt className="kv__k">{prettify(k)}</dt>
                <dd className="kv__v mono">{formatValue(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}
