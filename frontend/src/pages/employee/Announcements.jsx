import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import FilterBar from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { listAnnouncements } from '../../services/employeeService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function EmployeeAnnouncements() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { rows, meta, loading, error, refresh } = useApiList(listAnnouncements, { q, page, limit: 10 });

  return (
    <>
      <Helmet>
        <title>News · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Company"
        title="News"
        description="Announcements published to the whole team or to employees specifically."
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search news…"
        onRefresh={refresh}
        busy={loading}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="route-fallback" role="status">
          <Spinner label="Loading news" />
          <span>Loading announcements…</span>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={q ? 'No announcements match' : 'No news yet'}
          body="Updates from the company appear here."
        />
      ) : (
        <section className="panel">
          <ul className="feed">
            {rows.map((a) => (
              <li className="feed__item" key={a._id}>
                <div>
                  <strong>
                    <Link to={`/employee/announcements/${a._id}`}>{a.title}</Link>
                  </strong>
                  <span className="feed__meta cell-clamp">{a.body}</span>
                  <span className="feed__meta">
                    {fmt(a.createdAt)}
                    {a.createdBy?.name ? ` · ${a.createdBy.name}` : ''}
                  </span>
                </div>
                <StatusBadge value={a.audience === 'employees' ? 'info' : 'active'} label={a.audience} tone={a.audience === 'employees' ? 'info' : 'ok'} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />
    </>
  );
}
