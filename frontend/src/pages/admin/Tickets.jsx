import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import FilterBar from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { listTickets } from '../../services/adminService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');

export default function AdminTickets() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listTickets, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
  });

  const columns = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`/admin/tickets/${row._id || row.id}`}>{row.subject}</Link>
          <span className="cell-sub">
            {row.customer?.name || 'Unknown client'}
            {row.project?.title ? ` · ${row.project.title}` : ''}
          </span>
        </div>
      ),
    },
    { key: 'priority', header: 'Priority', render: (row) => <StatusBadge value={row.priority} /> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'replies', header: 'Replies', align: 'right', render: (row) => <span className="mono">{row.replies?.length || 0}</span> },
    { key: 'updatedAt', header: 'Updated', render: (row) => fmt(row.updatedAt) },
  ];

  return (
    <>
      <Helmet>
        <title>Tickets · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Support"
        title="Tickets"
        description="Client support conversations. Reply, prioritise and close from the ticket view."
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search subject or client…"
        onRefresh={refresh}
        busy={loading}
      >
        <select
          value={status}
          aria-label="Filter by status"
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="Support tickets"
        emptyTitle={q || status ? 'No tickets match' : 'No tickets yet'}
        emptyBody="Tickets raised from the client portal appear here."
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />
    </>
  );
}
