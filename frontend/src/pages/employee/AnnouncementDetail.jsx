import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/Button.jsx';
import { useApiQuery } from '../../hooks/useApiList.js';
import { getAnnouncement } from '../../services/employeeService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

export default function EmployeeAnnouncementDetail() {
  const { id } = useParams();
  const { data: item, loading, error } = useApiQuery(getAnnouncement, id);

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading announcement" />
        <span>Loading announcement…</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <>
        <PageHeader eyebrow="Company" title="News" />
        <Alert tone="error">{error || 'Announcement not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/employee/announcements" variant="ghost">
            Back to news
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{item.title} · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Announcement"
        title={item.title}
        description={`Published ${fmt(item.createdAt)}${item.createdBy?.name ? ` by ${item.createdBy.name}` : ''}`}
        actions={
          <Button to="/employee/announcements" variant="ghost">
            Back to news
          </Button>
        }
      />

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Message</h2>
            <div className="chip-row">
              <StatusBadge value="info" label={item.audience} tone="info" />
              <StatusBadge value="active" label="Published" />
            </div>
          </header>
          <p className="prose">{item.body}</p>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Meta</h2>
          </header>
          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Published by</dt>
              <dd className="kv__v">{item.createdBy?.name || 'SvapNora'}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Audience</dt>
              <dd className="kv__v">{item.audience === 'employees' ? 'Employees only' : 'Everyone'}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Date</dt>
              <dd className="kv__v">{fmt(item.createdAt)}</dd>
            </div>
          </dl>
          <div className="stack-actions">
            <Link className="btn btn--ghost" to="/employee/announcements">
              <span className="btn__label">Back to news</span>
              <span className="btn__arrow" aria-hidden="true">
                &gt;
              </span>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
