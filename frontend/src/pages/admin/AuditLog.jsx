import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Alert from '../../components/ui/Alert.jsx';
import FilterBar from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { auditLogs } from '../../services/adminService.js';

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminAudit() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { rows, meta, loading, error, refresh } = useApiList(auditLogs, { q, page, limit: 20 });

  const columns = [
    { key: 'timestamp', header: 'When', render: (row) => <span className="mono">{fmt(row.timestamp)}</span> },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <div className="cell-strong">
          {row.actorName || 'System'}
          <span className="cell-sub">{row.actorRole || ''}</span>
        </div>
      ),
    },
    { key: 'action', header: 'Action', render: (row) => <span className="mono">{row.action}</span> },
    { key: 'entity', header: 'Entity', render: (row) => <span className="mono">{row.entity}</span> },
    { key: 'summary', header: 'Summary', render: (row) => row.summary || <span className="cell-sub">—</span> },
  ];

  return (
    <>
      <Helmet>
        <title>Activity log · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="System"
        title="Activity log"
        description="Every administrative write is recorded here with the actor, target and timestamp."
      />

      <FilterBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search the log…" onRefresh={refresh} busy={loading} />

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="Audit log"
        emptyTitle={q ? 'No log entries match' : 'No activity recorded yet'}
        emptyBody="Sign-ins, record changes and status transitions appear here."
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />
    </>
  );
}
