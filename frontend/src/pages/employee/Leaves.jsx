import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/Button.jsx';
import FilterBar, { Field } from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { cancelLeave, createLeave, listLeaves } from '../../services/employeeService.js';

const TYPES = ['casual', 'sick', 'earned', 'unpaid', 'emergency'];
const STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const ms = new Date(b) - new Date(a);
  return Math.max(1, Math.round(ms / 86400000) + 1);
};

const EMPTY = { type: 'casual', fromDate: '', toDate: '', reason: '' };

export default function EmployeeLeaves() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listLeaves, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
  });

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toCancel, setToCancel] = useState(null);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await createLeave({
        type: form.type,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim(),
      });
      toast.success('Leave request submitted.');
      setCreating(false);
      setForm(EMPTY);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not submit this request.');
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancelLeave(toCancel._id || toCancel.id);
      toast.success('Request cancelled.');
      setToCancel(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not cancel this request.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Leave',
      render: (row) => (
        <div className="cell-strong">
          <span>{row.type} leave</span>
          <span className="cell-sub">
            {fmt(row.fromDate)} → {fmt(row.toDate)} · {daysBetween(row.fromDate, row.toDate)} day(s)
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => <span className="cell-sub cell-clamp">{row.reason}</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'review',
      header: 'Reviewed by',
      render: (row) => row.reviewedBy?.name || <span className="cell-sub">—</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        row.status === 'pending' ? (
          <div className="row-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="row-btn row-btn--danger" onClick={() => setToCancel(row)}>
              Cancel
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Leave · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Time off"
        title="My leave"
        description="Request time off and track what has been approved, rejected or cancelled."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            Request leave
          </Button>
        }
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search by reason or type…"
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
        caption="Leave requests"
        emptyTitle={q || status ? 'No requests match' : 'No leave requested yet'}
        emptyBody="Submit a request and your manager will review it."
        emptyAction={
          !q && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              Request leave
            </Button>
          )
        }
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Request leave"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Submitting…' : 'Submit request'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <Field label="Leave type">
            <select value={form.type} onChange={set('type')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <div className="form__row">
            <Field label="From" required>
              <input type="date" value={form.fromDate} onChange={set('fromDate')} required />
            </Field>
            <Field label="To" required hint={form.fromDate && form.toDate ? `${daysBetween(form.fromDate, form.toDate)} day(s)` : undefined}>
              <input type="date" value={form.toDate} onChange={set('toDate')} required min={form.fromDate || undefined} />
            </Field>
          </div>

          <Field label="Reason" required hint="At least 5 characters - your manager reads this.">
            <textarea rows={4} value={form.reason} onChange={set('reason')} required minLength={5} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel this request?"
        body="Only pending requests can be cancelled. This cannot be undone."
        confirmLabel="Cancel request"
        busy={busy}
        onConfirm={doCancel}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
}
