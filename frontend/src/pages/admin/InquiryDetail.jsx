import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/Button.jsx';
import { Field } from '../../components/admin/FilterBar.jsx';
import { useApiQuery } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { deleteInquiry, getInquiry, setInquiryNotes, setInquiryStatus } from '../../services/adminService.js';

const STATUSES = ['new', 'contacted', 'closed'];
const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default function AdminInquiryDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: inquiry, loading, error, refresh } = useApiQuery(getInquiry, id);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState(false);

  useEffect(() => {
    if (inquiry) setNotes(inquiry.notes || '');
  }, [inquiry]);

  const run = async (fn, message) => {
    setBusy(true);
    setFormError('');
    try {
      await fn();
      if (message) toast.success(message);
      refresh();
    } catch (err) {
      const msg = err?.message || 'Update failed.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async (e) => {
    e.preventDefault();
    await run(() => setInquiryNotes(id, notes), 'Notes saved.');
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteInquiry(id);
      toast.success('Inquiry deleted.');
      navigate('/admin/inquiries');
    } catch (err) {
      toast.error(err?.message || 'Could not delete this inquiry.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading inquiry" />
        <span>Loading inquiry…</span>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <>
        <PageHeader eyebrow="Leads" title="Inquiry" />
        <Alert tone="error">{error || 'Inquiry not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/admin/inquiries" variant="ghost">
            Back to inquiries
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{inquiry.name} · Inquiry · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={`Inquiry · ${inquiry.type === 'briefing' ? 'Project briefing' : 'Contact form'}`}
        title={inquiry.name}
        description={inquiry.serviceInterest ? `Interested in ${inquiry.serviceInterest}` : 'Website inquiry'}
        actions={
          <>
            <a className="btn btn--ghost" href={`mailto:${inquiry.email}`}>
              Email them
            </a>
            <Button variant="danger" onClick={() => setToDelete(true)} disabled={busy}>
              Delete
            </Button>
          </>
        }
      />

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Message</h2>
            <StatusBadge value={inquiry.status} />
          </header>

          {formError && <Alert tone="error">{formError}</Alert>}

          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Email</dt>
              <dd className="kv__v mono">{inquiry.email}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Phone</dt>
              <dd className="kv__v mono">{inquiry.phone || '—'}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Received</dt>
              <dd className="kv__v">{fmt(inquiry.createdAt)}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Service interest</dt>
              <dd className="kv__v">{inquiry.serviceInterest || '—'}</dd>
            </div>
          </dl>

          <blockquote className="quote">{inquiry.message}</blockquote>

          <Field label="Move to">
            <select value={inquiry.status} disabled={busy} onChange={(e) => run(() => setInquiryStatus(id, e.target.value), 'Status updated.')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Internal notes</h2>
            <span className="cell-sub">Never shown to the visitor</span>
          </header>

          <form className="form" onSubmit={saveNotes}>
            <Field label="Notes">
              <textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call log, qualification, next step…" />
            </Field>
            <p className="cell-sub">Leave empty to clear the notes.</p>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save notes'}
            </Button>
          </form>

          <div className="stack-actions">
            <Link className="btn btn--ghost" to="/admin/inquiries">
              Back to inquiries
            </Link>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={toDelete}
        title="Delete inquiry?"
        body="This lead and its notes will be permanently removed."
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(false)}
      />
    </>
  );
}
