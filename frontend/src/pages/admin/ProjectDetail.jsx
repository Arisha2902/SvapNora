import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/Button.jsx';
import { Field } from '../../components/admin/FilterBar.jsx';
import { useApiQuery } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import {
  assignProject,
  deleteProject,
  featureProject,
  getProject,
  listCustomers,
  listEmployees,
  listTasks,
  progressProject,
  publishProject,
  updateProject,
} from '../../services/adminService.js';

const CATEGORIES = ['CRM', 'Custom Software', 'Web Applications', 'Integrations'];
const STATUSES = ['planning', 'in-progress', 'review', 'completed', 'on-hold'];
const toISO = (d) => (d ? String(d).slice(0, 10) : '');
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const EMPTY = {
  title: '',
  category: CATEGORIES[0],
  shortDescription: '',
  fullDescription: '',
  status: 'planning',
  order: 0,
  tags: '',
  startDate: '',
  dueDate: '',
};

export default function AdminProjectDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: project, loading, error, refresh } = useApiQuery(getProject, id);
  const [tasks, setTasks] = useState([]);

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [team, setTeam] = useState({ employees: [], customers: [], selected: [] });
  const [toDelete, setToDelete] = useState(false);

  const loadTasks = () =>
    listTasks({ project: id, limit: 50 })
      .then((res) => setTasks(res?.data?.items || []))
      .catch(() => setTasks([]));

  useEffect(() => {
    if (project) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id]);

  useEffect(() => {
    if (!assigning) return undefined;
    let alive = true;
    Promise.allSettled([listEmployees({ limit: 100 }), listCustomers({ limit: 100 })]).then(([e, c]) => {
      if (!alive) return;
      setTeam((t) => ({
        ...t,
        employees: e.status === 'fulfilled' ? e.value?.data?.items || [] : [],
        customers: c.status === 'fulfilled' ? c.value?.data?.items || [] : [],
      }));
    });
    return () => {
      alive = false;
    };
  }, [assigning]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

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
      title: project.title || '',
      category: project.category || CATEGORIES[0],
      shortDescription: project.shortDescription || '',
      fullDescription: project.fullDescription || '',
      status: project.status || 'planning',
      order: project.order ?? 0,
      tags: (project.tags || []).join(', '),
      startDate: toISO(project.startDate),
      dueDate: toISO(project.dueDate),
    });
    setFormError('');
    setEditing(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await updateProject(id, {
        title: form.title.trim(),
        category: form.category,
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim(),
        status: form.status,
        order: Number(form.order) || 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
      });
      toast.success('Project updated.');
      setEditing(false);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  const openAssign = () => {
    setTeam((t) => ({
      ...t,
      selected: (project.assignedEmployees || []).map((e) => e._id || e),
      customerId: project.customer?._id || project.customer || '',
    }));
    setAssigning(true);
  };

  const saveAssign = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await assignProject(id, {
        assignedEmployees: team.selected,
        ...(team.customerId !== undefined ? { customer: team.customerId || null } : {}),
      });
      toast.success('Team assignment updated.');
      setAssigning(false);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not update the assignment.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteProject(id);
      toast.success('Project deleted.');
      navigate('/admin/projects');
    } catch (err) {
      toast.error(err?.message || 'Could not delete this project.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading project" />
        <span>Loading project…</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <>
        <PageHeader eyebrow="Delivery" title="Project" />
        <Alert tone="error">{error || 'Project not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/admin/projects" variant="ghost">
            Back to projects
          </Button>
        </div>
      </>
    );
  }

  const taskColumns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => <Link to={`/admin/tasks/${row._id}`}>{row.title}</Link>,
    },
    { key: 'assignedTo', header: 'Owner', render: (row) => row.assignedTo?.name || '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'priority', header: 'Priority', render: (row) => <StatusBadge value={row.priority} /> },
  ];

  return (
    <>
      <Helmet>
        <title>{project.title} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={`Project · ${project.category}`}
        title={project.title}
        description={project.shortDescription}
        actions={
          <>
            <Button variant="ghost" onClick={openAssign} disabled={busy}>
              Assign team
            </Button>
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
            <h2 className="panel__title">Overview</h2>
            <div className="chip-row">
              <StatusBadge value={project.status} />
              <StatusBadge value={project.isPublished ? 'active' : 'inactive'} label={project.isPublished ? 'Published' : 'Draft'} />
              {project.isFeatured && <StatusBadge value="info" label="Featured" tone="info" />}
            </div>
          </header>

          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Client</dt>
              <dd className="kv__v">
                {project.customer ? (
                  <Link to={`/admin/customers/${project.customer._id || project.customer}`}>
                    {project.customer.name}
                    {project.customer.companyName ? ` · ${project.customer.companyName}` : ''}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Timeline</dt>
              <dd className="kv__v">
                {fmt(project.startDate)} → {fmt(project.dueDate)}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Order</dt>
              <dd className="kv__v mono">{project.order ?? 0}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Tags</dt>
              <dd className="kv__v">{(project.tags || []).join(', ') || '—'}</dd>
            </div>
          </dl>

          <div className="progress progress--lg">
            <div className="progress__fill" style={{ width: `${project.progress || 0}%` }} />
            <span className="progress__val">{project.progress || 0}% complete</span>
          </div>

          <div className="stack-actions">
            <Button variant="ghost" onClick={() => run(() => publishProject(id, !project.isPublished), project.isPublished ? 'Unpublished.' : 'Published to the public site.')} disabled={busy}>
              {project.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="ghost" onClick={() => run(() => featureProject(id, !project.isFeatured), project.isFeatured ? 'Removed from featured.' : 'Marked as featured.')} disabled={busy}>
              {project.isFeatured ? 'Unfeature' : 'Feature'}
            </Button>
          </div>

          <Field label={`Progress (${project.progress || 0}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={project.progress || 0}
              onMouseUp={(e) => {
                const v = Number(e.target.value);
                if (v !== project.progress) run(() => progressProject(id, v), 'Progress updated.');
              }}
              onTouchEnd={(e) => {
                const v = Number(e.target.value);
                if (v !== project.progress) run(() => progressProject(id, v), 'Progress updated.');
              }}
            />
          </Field>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Team</h2>
            <button type="button" className="linkish" onClick={openAssign}>
              Change
            </button>
          </header>
          {(project.assignedEmployees || []).length ? (
            <ul className="related__list">
              {project.assignedEmployees.map((emp) => (
                <li key={emp._id || emp}>
                  <Link to={`/admin/employees/${emp._id || emp}`}>{emp.name}</Link>
                  <span className="cell-sub">{emp.designation || emp.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cell-sub">No one assigned yet.</p>
          )}

          <h3 className="related__title">Full description</h3>
          <p className="prose">{project.fullDescription || 'No long-form description.'}</p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <header className="panel__head">
          <h2 className="panel__title">Tasks on this project ({tasks.length})</h2>
          <button type="button" className="linkish" onClick={loadTasks}>
            Refresh
          </button>
        </header>
        <DataTable columns={taskColumns} rows={tasks} loading={false} caption="Project tasks" emptyTitle="No tasks yet" emptyBody="Tasks created against this project show up here." />
      </section>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit project"
        size="lg"
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
          <Field label="Short description" required hint="20-400 characters">
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
        </form>
      </Modal>

      <Modal
        open={assigning}
        onClose={() => setAssigning(false)}
        title="Assign team"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssigning(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveAssign} disabled={busy}>
              {busy ? 'Saving…' : 'Save assignment'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={saveAssign}>
          <Field label="Client">
            <select value={team.customerId || ''} onChange={(e) => setTeam((t) => ({ ...t, customerId: e.target.value }))}>
              <option value="">No client assigned</option>
              {team.customers.map((c) => (
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
              size={7}
              value={team.selected}
              onChange={(e) => setTeam((t) => ({ ...t, selected: Array.from(e.target.selectedOptions).map((o) => o.value) }))}
            >
              {team.employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                  {emp.designation ? ` — ${emp.designation}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete}
        title="Delete project?"
        body="The project and its timeline will be permanently removed. Tasks are kept."
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(false)}
      />
    </>
  );
}
