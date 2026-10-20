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
  createProject,
  deleteProject,
  featureProject,
  listCustomers,
  listEmployees,
  listProjects,
  publishProject,
  updateProject,
} from '../../services/adminService.js';

const CATEGORIES = ['CRM', 'Custom Software', 'Web Applications', 'Integrations'];
const STATUSES = ['planning', 'in-progress', 'review', 'completed', 'on-hold'];

const EMPTY = {
  title: '',
  category: CATEGORIES[0],
  shortDescription: '',
  fullDescription: '',
  status: 'planning',
  progress: 0,
  order: 0,
  tags: '',
  startDate: '',
  dueDate: '',
  isPublished: false,
  isFeatured: false,
  customer: '',
  assignedEmployees: [],
};

const toISO = (d) => (d ? String(d).slice(0, 10) : '');

export default function AdminProjects() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listProjects, {
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
  const [people, setPeople] = useState({ employees: [], customers: [] });

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    Promise.allSettled([listEmployees({ limit: 100 }), listCustomers({ limit: 100 })]).then(([e, c]) => {
      if (!alive) return;
      setPeople({
        employees: e.status === 'fulfilled' ? e.value?.data?.items || [] : [],
        customers: c.status === 'fulfilled' ? c.value?.data?.items || [] : [],
      });
    });
    return () => {
      alive = false;
    };
  }, [editing]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const setChecked = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.checked }));

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setEditing('new');
  };

  const openEdit = (row) => {
    setForm({
      title: row.title || '',
      category: row.category || CATEGORIES[0],
      shortDescription: row.shortDescription || '',
      fullDescription: row.fullDescription || '',
      status: row.status || 'planning',
      progress: row.progress ?? 0,
      order: row.order ?? 0,
      tags: (row.tags || []).join(', '),
      startDate: toISO(row.startDate),
      dueDate: toISO(row.dueDate),
      isPublished: Boolean(row.isPublished),
      isFeatured: Boolean(row.isFeatured),
      customer: row.customer?._id || row.customer || '',
      assignedEmployees: (row.assignedEmployees || []).map((e) => e._id || e),
    });
    setFormError('');
    setEditing(row);
  };

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim(),
        status: form.status,
        progress: Number(form.progress) || 0,
        order: Number(form.order) || 0,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPublished: Boolean(form.isPublished),
        isFeatured: Boolean(form.isFeatured),
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        customer: form.customer || null,
        assignedEmployees: form.assignedEmployees,
      };

      if (editing === 'new') await createProject(payload);
      else await updateProject(editing._id || editing.id, payload);

      toast.success(editing === 'new' ? 'Project created.' : 'Project updated.');
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save this project.');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (row) => {
    try {
      await publishProject(row._id || row.id, !row.isPublished);
      toast.success(row.isPublished ? 'Unpublished.' : 'Published to the public site.');
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not change publish state.');
    }
  };

  const toggleFeature = async (row) => {
    try {
      await featureProject(row._id || row.id, !row.isFeatured);
      toast.success(row.isFeatured ? 'Removed from featured.' : 'Marked as featured.');
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not change featured state.');
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteProject(toDelete._id || toDelete.id);
      toast.success('Project deleted.');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this project.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Project',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`/admin/projects/${row._id || row.id}`}>{row.title}</Link>
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
      key: 'flags',
      header: 'Visibility',
      render: (row) => (
        <div className="chip-row">
          <StatusBadge value={row.isPublished ? 'active' : 'inactive'} label={row.isPublished ? 'Published' : 'Draft'} />
          {row.isFeatured && <StatusBadge value="info" label="Featured" tone="info" />}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="row-btn" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="row-btn" onClick={() => togglePublish(row)}>
            {row.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button type="button" className="row-btn" onClick={() => toggleFeature(row)}>
            {row.isFeatured ? 'Unfeature' : 'Feature'}
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
        <title>Projects · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Plan, assign, publish and track every engagement from one table."
        actions={
          <Button variant="primary" onClick={openCreate}>
            New project
          </Button>
        }
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search title or tag…"
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
        caption="Projects"
        emptyTitle={q || status ? 'No projects match those filters' : 'No projects yet'}
        emptyBody="Create the first project to start assigning work."
        emptyAction={
          !q && (
            <Button variant="primary" onClick={openCreate}>
              New project
            </Button>
          )
        }
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New project' : 'Edit project'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save project'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <Field label="Title" required>
            <input value={form.title} onChange={set('title')} required minLength={3} />
          </Field>

          <div className="form__row">
            <Field label="Category" required>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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

          <Field label="Short description" required hint="20-400 characters. Shown in listings.">
            <textarea rows={3} value={form.shortDescription} onChange={set('shortDescription')} required minLength={20} />
          </Field>

          <Field label="Full description">
            <textarea rows={5} value={form.fullDescription} onChange={set('fullDescription')} />
          </Field>

          <div className="form__row">
            <Field label="Tags" hint="Comma separated">
              <input value={form.tags} onChange={set('tags')} />
            </Field>
            <Field label="Order">
              <input type="number" min={0} value={form.order} onChange={set('order')} />
            </Field>
          </div>

          <div className="form__row">
            <Field label="Start date">
              <input type="date" value={form.startDate} onChange={set('startDate')} />
            </Field>
            <Field label="Due date">
              <input type="date" value={form.dueDate} onChange={set('dueDate')} />
            </Field>
          </div>

          <Field label={`Progress (${form.progress}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
            />
          </Field>

          <div className="form__row">
            <Field label="Client">
              <select value={form.customer} onChange={set('customer')}>
                <option value="">No client assigned</option>
                {people.customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.companyName ? ` — ${c.companyName}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned team" hint="Hold Ctrl/Cmd to select several">
              <select
                multiple
                size={5}
                value={form.assignedEmployees}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assignedEmployees: Array.from(e.target.selectedOptions).map((o) => o.value) }))
                }
              >
                {people.employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                    {emp.department ? ` — ${emp.department}` : ''}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="check-row">
            <label className="check">
              <input type="checkbox" checked={form.isPublished} onChange={setChecked('isPublished')} />
              <span>Publish to the public site</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={form.isFeatured} onChange={setChecked('isFeatured')} />
              <span>Mark as featured</span>
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete project?"
        body={`${toDelete?.title || 'This project'} and its timeline will be permanently removed. Tasks are kept.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
