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
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from '../../services/adminService.js';

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'employees', label: 'Employees only' },
  { value: 'customers', label: 'Clients only' },
];

const EMPTY = { title: '', body: '', audience: 'all', isPublished: true };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function AdminAnnouncements() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [published, setPublished] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listAnnouncements, {
    q,
    page,
    limit: 10,
    ...(published ? { published } : {}),
  });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setEditing('new');
  };

  const openEdit = (row) => {
    setForm({
      title: row.title || '',
      body: row.body || '',
      audience: row.audience || 'all',
      isPublished: Boolean(row.isPublished),
    });
    setFormError('');
    setEditing(row);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        isPublished: Boolean(form.isPublished),
      };
      if (editing === 'new') await createAnnouncement(payload);
      else await updateAnnouncement(editing._id || editing.id, payload);
      toast.success(editing === 'new' ? 'Announcement published.' : 'Announcement updated.');
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save this announcement.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteAnnouncement(toDelete._id || toDelete.id);
      toast.success('Announcement deleted.');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this announcement.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Announcement',
      render: (row) => (
        <div className="cell-strong">
          <button type="button" className="linkish" onClick={() => openEdit(row)}>
            {row.title}
          </button>
          <span className="cell-sub cell-clamp">{row.body}</span>
        </div>
      ),
    },
    { key: 'audience', header: 'Audience', render: (row) => <span className="mono">{row.audience}</span> },
    { key: 'createdAt', header: 'Posted', render: (row) => fmt(row.createdAt) },
    {
      key: 'isPublished',
      header: 'State',
      render: (row) => (
        <StatusBadge value={row.isPublished ? 'active' : 'inactive'} label={row.isPublished ? 'Published' : 'Draft'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="row-btn" onClick={() => openEdit(row)}>
            Edit
          </button>
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
        <title>Announcements · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Communication"
        title="Announcements"
        description="Publish news to employees, clients, or everyone at once."
        actions={
          <Button variant="primary" onClick={openCreate}>
            New announcement
          </Button>
        }
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search announcements…"
        onRefresh={refresh}
        busy={loading}
      >
        <select
          value={published}
          aria-label="Filter by publish state"
          onChange={(e) => {
            setPublished(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="Announcements"
        emptyTitle={q ? 'No announcements match' : 'No announcements yet'}
        emptyBody="Post an update and it appears in both portals."
        emptyAction={
          !q && (
            <Button variant="primary" onClick={openCreate}>
              New announcement
            </Button>
          )
        }
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New announcement' : 'Edit announcement'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <Field label="Title" required>
            <input value={form.title} onChange={set('title')} required minLength={3} />
          </Field>

          <Field label="Body" required hint="10-10000 characters">
            <textarea rows={7} value={form.body} onChange={set('body')} required minLength={10} />
          </Field>

          <div className="form__row">
            <Field label="Audience">
              <select value={form.audience} onChange={set('audience')}>
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
        open={Boolean(toDelete)}
        title="Delete announcement?"
        body={`${toDelete?.title || 'This announcement'} will be removed from every portal.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
