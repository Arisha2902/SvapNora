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
import { deleteAnnouncement, getAnnouncement, updateAnnouncement } from '../../services/adminService.js';

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'employees', label: 'Employees only' },
  { value: 'customers', label: 'Clients only' },
];

const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default function AdminAnnouncementDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: item, loading, error, refresh } = useApiQuery(getAnnouncement, id);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', isPublished: true });
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState(false);

  const openEdit = () => {
    setForm({
      title: item.title || '',
      body: item.body || '',
      audience: item.audience || 'all',
      isPublished: Boolean(item.isPublished),
    });
    setFormError('');
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await updateAnnouncement(id, {
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        isPublished: Boolean(form.isPublished),
      });
      toast.success('Announcement updated.');
      setEditing(false);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted.');
      navigate('/admin/announcements');
    } catch (err) {
      toast.error(err?.message || 'Could not delete this announcement.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading announcement" />
        <span>Loading announcement…</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <>
        <PageHeader eyebrow="Communication" title="Announcement" />
        <Alert tone="error">{error || 'Announcement not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/admin/announcements" variant="ghost">
            Back to announcements
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{item.title} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Announcement"
        title={item.title}
        description={item.audience === 'all' ? 'Visible to employees and clients' : `Visible to ${item.audience} only`}
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
            <h2 className="panel__title">Content</h2>
            <div className="chip-row">
              <StatusBadge value={item.isPublished ? 'active' : 'inactive'} label={item.isPublished ? 'Published' : 'Draft'} />
              <StatusBadge value="info" label={item.audience} tone="info" />
            </div>
          </header>
          <p className="prose">{item.body}</p>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Meta</h2>
          </header>
          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Posted by</dt>
              <dd className="kv__v">{item.createdBy?.name || '—'}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Created</dt>
              <dd className="kv__v">{fmt(item.createdAt)}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Updated</dt>
              <dd className="kv__v">{fmt(item.updatedAt)}</dd>
            </div>
          </dl>
          <div className="stack-actions">
            <Link className="btn btn--ghost" to="/admin/announcements">
              Back to announcements
            </Link>
          </div>
        </section>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit announcement"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}
          <Field label="Title" required>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required minLength={3} />
          </Field>
          <Field label="Body" required hint="10-10000 characters">
            <textarea rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required minLength={10} />
          </Field>
          <div className="form__row">
            <Field label="Audience">
              <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="State">
              <select
                value={form.isPublished ? 'true' : 'false'}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.value === 'true' }))}
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete}
        title="Delete announcement?"
        body="This announcement will be removed from every portal."
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(false)}
      />
    </>
  );
}
