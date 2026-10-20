import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  createInvoice,
  deleteInvoice,
  listCustomers,
  listInvoices,
  listProjects,
} from '../../services/adminService.js';

const STATUSES = ['pending', 'paid', 'overdue'];
const money = (n, c = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(Number(n || 0));
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const EMPTY = { customer: '', project: '', amount: '', currency: 'INR', dueDate: '', status: 'pending', notes: '' };

export default function AdminInvoices() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listInvoices, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
  });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [refs, setRefs] = useState({ customers: [], projects: [] });

  useEffect(() => {
    if (!editing) return undefined;
    let alive = true;
    Promise.allSettled([listCustomers({ limit: 100 }), listProjects({ limit: 100 })]).then(([c, p]) => {
      if (!alive) return;
      setRefs({
        customers: c.status === 'fulfilled' ? c.value?.data?.items || [] : [],
        projects: p.status === 'fulfilled' ? p.value?.data?.items || [] : [],
      });
    });
    return () => {
      alive = false;
    };
  }, [editing]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setEditing('new');
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const payload = {
        customer: form.customer,
        amount: Number(form.amount),
        currency: form.currency,
        dueDate: form.dueDate,
        status: form.status,
        ...(form.project ? { project: form.project } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      };
      if (editing === 'new') await createInvoice(payload);
      toast.success('Invoice created.');
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not create this invoice.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteInvoice(toDelete._id || toDelete.id);
      toast.success('Invoice deleted.');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this invoice.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'number',
      header: 'Invoice',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`/admin/invoices/${row._id || row.id}`}>{row.number || `INV-${String(row._id).slice(-6).toUpperCase()}`}</Link>
          <span className="cell-sub">{row.customer?.name || row.customer?.companyName || '—'}</span>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (row) => <span className="mono">{money(row.amount, row.currency)}</span> },
    { key: 'dueDate', header: 'Due', render: (row) => fmt(row.dueDate) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <Link className="row-btn" to={`/admin/invoices/${row._id || row.id}`}>
            Open
          </Link>
          <button type="button" className="row-btn row-btn--danger" onClick={() => setToDelete(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Invoices · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Finance"
        title="Invoices"
        description="Issue, track and settle client invoices. Paid totals feed the dashboard."
        actions={
          <Button variant="primary" onClick={openCreate}>
            New invoice
          </Button>
        }
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search invoices…"
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
        caption="Invoices"
        emptyTitle={q || status ? 'No invoices match' : 'No invoices yet'}
        emptyBody="Raise the first invoice against a client account."
        emptyAction={
          !q && (
            <Button variant="primary" onClick={openCreate}>
              New invoice
            </Button>
          )
        }
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="New invoice"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Create invoice'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="form__row">
            <Field label="Client" required>
              <select value={form.customer} onChange={set('customer')} required>
                <option value="">Select a client</option>
                {refs.customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.companyName ? ` — ${c.companyName}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Project">
              <select value={form.project} onChange={set('project')}>
                <option value="">Not linked</option>
                {refs.projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="form__row">
            <Field label="Amount" required>
              <input type="number" min={0} step="0.01" value={form.amount} onChange={set('amount')} required />
            </Field>
            <Field label="Currency" hint="3 letter ISO code">
              <input maxLength={3} value={form.currency} onChange={set('currency')} />
            </Field>
          </div>

          <div className="form__row">
            <Field label="Due date" required>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea rows={3} value={form.notes} onChange={set('notes')} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete invoice?"
        body="This invoice and its line items will be permanently removed."
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
