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
import { listTasks } from '../../services/employeeService.js';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : <span className="cell-sub">No due date</span>;

export default function EmployeeTasks() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listTasks, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  });

  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`/employee/tasks/${row._id || row.id}`}>{row.title}</Link>
          <span className="cell-sub">{row.project?.title || 'No project'}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'priority', header: 'Priority', render: (row) => <StatusBadge value={row.priority} /> },
    { key: 'dueDate', header: 'Due', render: (row) => <span className="mono">{fmt(row.dueDate)}</span> },
  ];

  return (
    <>
      <Helmet>
        <title>My tasks · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Delivery"
        title="My tasks"
        description="Work assigned to you. Open a task to update its status or leave a comment."
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search my tasks…"
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
        <select
          value={priority}
          aria-label="Filter by priority"
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="My tasks"
        emptyTitle={q || status || priority ? 'No tasks match those filters' : 'No tasks assigned'}
        emptyBody="When a project lead assigns work to you it appears here."
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />
    </>
  );
}
