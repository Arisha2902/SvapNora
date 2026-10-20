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
import { listProjects } from '../../services/employeeService.js';

const STATUSES = ['planning', 'in-progress', 'review', 'completed', 'on-hold'];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function EmployeeProjects() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listProjects, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
  });

  const columns = [
    {
      key: 'title',
      header: 'Project',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`/employee/projects/${row._id || row.id}`}>{row.title}</Link>
          <span className="cell-sub">{row.category}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <div className="progress">
          <div className="progress__fill" style={{ width: `${row.progress || 0}%` }} />
          <span className="progress__val">{row.progress || 0}%</span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) => <span className="mono">{fmt(row.dueDate)}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      render: (row) => row.customer?.companyName || row.customer?.name || <span className="cell-sub">—</span>,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Projects · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Delivery"
        title="My projects"
        description="Every engagement you are assigned to, with live progress and your tasks inside."
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search projects…"
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
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="My projects"
        emptyTitle={q || status ? 'No projects match' : 'No projects assigned yet'}
        emptyBody="When an admin assigns you to a project it shows up here."
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />
    </>
  );
}
