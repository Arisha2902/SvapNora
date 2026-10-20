import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/Button.jsx';
import FilterBar, { Field } from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { approveLeave, listLeaves, rejectLeave } from '../../services/adminService.js';

const dayCount = (from, to) => {
  if (!from || !to) return 0;
  const ms = new Date(to) - new Date(from);
  return Math.round(ms / 86400000) + 1;
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function AdminLeaves() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const { rows, meta, loading, error, refresh } = useApiList(listLeaves, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
  });

  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (action) => {
    setBusy(true);
    try {
      if (action === 'approve') await approveLeave(open._id || open.id, note);
      else await rejectLeave(open._id || open.id, note);
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'}.`);
      setOpen(null);
      setNote('');
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not update this request.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div className="cell-strong">
          <button type="button" className="linkish" onClick={() => setOpen(row)}>
            {row.employee?.name || 'Unknown'}
          </button>
          <span className="cell-sub">{row.employee?.department || row.employee?.email || ''}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <span className="mono">{row.type}</span> },
    {
      key: 'dates',
      header: 'Dates',
      render: (row) => (
        <div className="cell-strong">
          {fmt(row.fromDate)} → {fmt(row.toDate)}
          <span className="cell-sub">{dayCount(row.fromDate, row.toDate)} day(s)</span>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', render: (row) => <span className="cell-clamp">{row.reason}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="row-btn" onClick={() => setOpen(row)}>
            Review
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Leave requests · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="People"
        title="Leave requests"
        description="Approve or reject time-off requests from the employee portal."
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search employee…"
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="Leave requests"
        emptyTitle={status === 'pending' ? 'No leave awaiting review' : 'No leave requests match'}
        emptyBody="Requests submitted from the employee portal appear here."
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title="Review leave request"
        subtitle={open ? `${open.employee?.name || ''} · ${open.type}` : ''}
        size="sm"
        footer={
          open?.status === 'pending' ? (
            <>
              <Button variant="ghost" onClick={() => decide('reject')} disabled={busy}>
                {busy ? 'Working…' : 'Reject'}
              </Button>
              <Button variant="primary" onClick={() => decide('approve')} disabled={busy}>
                {busy ? 'Working…' : 'Approve'}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Close
            </Button>
          )
        }
      >
        {open && (
          <div className="detail">
            <div className="detail__row">
              <StatusBadge value={open.status} />
              <span className="cell-sub">
                {fmt(open.fromDate)} → {fmt(open.toDate)} · {dayCount(open.fromDate, open.toDate)} day(s)
              </span>
            </div>
            <p className="detail__quote">{open.reason}</p>
            {open.reviewNote && (
              <p className="cell-sub">
                Previous review note: {open.reviewNote}
              </p>
            )}
            {open.status === 'pending' && (
              <Field label="Review note" hint="Optional - shown to the employee.">
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
