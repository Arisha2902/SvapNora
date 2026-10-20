import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/Button.jsx';
import { Field } from '../../components/admin/FilterBar.jsx';
import { useApiQuery } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { deleteInvoice, getInvoice, setInvoiceStatus, updateInvoice } from '../../services/adminService.js';

const STATUSES = ['pending', 'paid', 'overdue'];
const toISO = (d) => (d ? String(d).slice(0, 10) : '');
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const money = (n, c = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(Number(n || 0));

export default function AdminInvoiceDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: invoice, loading, error, refresh } = useApiQuery(getInvoice, id);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: 'INR', dueDate: '', status: 'pending', notes: '', fileUrl: '' });
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState(false);

  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      if (message) toast.success(message);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = () => {
    setForm({
      amount: invoice.amount ?? '',
      currency: invoice.currency || 'INR',
      dueDate: toISO(invoice.dueDate),
      status: invoice.status || 'pending',
      notes: invoice.notes || '',
      fileUrl: invoice.fileUrl || '',
    });
    setFormError('');
    setEditing(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await updateInvoice(id, {
        amount: Number(form.amount),
        currency: form.currency,
        dueDate: form.dueDate,
        status: form.status,
        notes: form.notes,
        fileUrl: form.fileUrl,
      });
      toast.success('Invoice updated.');
      setEditing(false);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save this invoice.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted.');
      navigate('/admin/invoices');
    } catch (err) {
      toast.error(err?.message || 'Could not delete this invoice.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading invoice" />
        <span>Loading invoice…</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <PageHeader eyebrow="Finance" title="Invoice" />
        <Alert tone="error">{error || 'Invoice not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/admin/invoices" variant="ghost">
            Back to invoices
          </Button>
        </div>
      </>
    );
  }

  const number = invoice.number || `INV-${String(invoice._id).slice(-6).toUpperCase()}`;

  return (
    <>
      <Helmet>
        <title>{number} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Invoice"
        title={number}
        description={`${money(invoice.amount, invoice.currency)} · due ${fmt(invoice.dueDate)}`}
        actions={
          <>
            <Button variant="ghost" onClick={openEdit} disabled={busy}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setToDelete(true)} disabled={busy}>
              Delete
            </Button>
          </>
        }
      />

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Summary</h2>
            <StatusBadge value={invoice.status} />
          </header>

          <dl className="kv-grid">
            <div className="kv kv--total">
              <dt className="kv__k">Amount</dt>
              <dd className="kv__v kv__v--amount mono">{money(invoice.amount, invoice.currency)}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Client</dt>
              <dd className="kv__v">
                {invoice.customer ? (
                  <Link to={`/admin/customers/${invoice.customer._id}`}>{invoice.customer.name}</Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Project</dt>
              <dd className="kv__v">
                {invoice.project ? <Link to={`/admin/projects/${invoice.project._id}`}>{invoice.project.title}</Link> : '—'}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Due date</dt>
              <dd className="kv__v">{fmt(invoice.dueDate)}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Issued</dt>
              <dd className="kv__v">{fmt(invoice.createdAt)}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Notes</dt>
              <dd className="kv__v">{invoice.notes || '—'}</dd>
            </div>
          </dl>

          <div className="stack-actions">
            <Field label="Set status">
              <select value={invoice.status} disabled={busy} onChange={(e) => run(() => setInvoiceStatus(id, e.target.value), 'Status updated.')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            {invoice.status !== 'paid' && (
              <Button variant="primary" disabled={busy} onClick={() => run(() => setInvoiceStatus(id, 'paid'), 'Marked as paid.')}>
                Mark as paid
              </Button>
            )}
          </div>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Document</h2>
          </header>
          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Currency</dt>
              <dd className="kv__v mono">{invoice.currency}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Attachment</dt>
              <dd className="kv__v">
                {invoice.fileUrl ? (
                  <a href={invoice.fileUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                ) : (
                  'No file attached'
                )}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Client contact</dt>
              <dd className="kv__v mono">{invoice.customer?.email || '—'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit ${number}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEdit} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={saveEdit}>
          {formError && <Alert tone="error">{formError}</Alert>}
          <div className="form__row">
            <Field label="Amount" required>
              <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
            </Field>
            <Field label="Currency" hint="3 letter ISO code">
              <input maxLength={3} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            </Field>
          </div>
          <div className="form__row">
            <Field label="Due date" required>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <Field label="Attachment URL">
            <input value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete}
        title="Delete invoice?"
        body={`${number} will be permanently removed.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(false)}
      />
    </>
  );
}
