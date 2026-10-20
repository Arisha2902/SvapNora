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
  createTask,
  deleteTask,
  listEmployees,
  listProjects,
  listTasks,
} from '../../services/adminService.js';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const EMPTY = { title: '', description: '', project: '', assignedTo: '', status: 'todo', priority: 'medium', dueDate: '' };

export default function AdminTasks() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listTasks, {
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
  const [refs, setRefs] = useState({ projects: [], employees: [] });

  useEffect(() => {
    if (!editing) return undefined;
    let alive = true;
    Promise.allSettled([listProjects({ limit: 100 }), listEmployees({ limit: 100 })]).then(([p, e]) => {
      if (!alive) return;
      setRefs({
        projects: p.status === 'fulfilled' ? p.value?.data?.items || [] : [],
        employees: e.status === 'fulfilled' ? e.value?.data?.items || [] : [],
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
        title: form.title.trim(),
        description: form.description.trim(),
        project: form.project,
        assignedTo: form.assignedTo,
        status: form.status,
        priority: form.priority,
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      };
      if (editing === 'new') await createTask(payload);
      toast.success('Task created.');
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not create this task.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteTask(toDelete._id || toDelete.id);
      toast.success('Task deleted.');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this task.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`/admin/tasks/${row._id || row.id}`}>{row.title}</Link>
          <span className="cell-sub">{row.project?.title || 'Unassigned project'}</span>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Owner',
      render: (row) => row.assignedTo?.name || <span className="cell-sub">—</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'priority', header: 'Priority', render: (row) => <StatusBadge value={row.priority} /> },
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) =>
        row.dueDate ? (
          <span className="mono">{new Date(row.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        ) : (
          <span className="cell-sub">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
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
        <title>Tasks · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Delivery"
        title="Tasks"
        description="Assign work to the team and follow it from todo through review to done."
        actions={
          <Button variant="primary" onClick={openCreate}>
            New task
          </Button>
        }
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search tasks…"
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
        caption="Tasks"
        emptyTitle={q || status ? 'No tasks match those filters' : 'No tasks yet'}
        emptyBody="Create a task to put work on someone's board."
        emptyAction={
          !q && (
            <Button variant="primary" onClick={openCreate}>
              New task
            </Button>
          )
        }
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="New task"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Create task'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <Field label="Title" required>
            <input value={form.title} onChange={set('title')} required minLength={3} />
          </Field>

          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={set('description')} />
          </Field>

          <div className="form__row">
            <Field label="Project" required>
              <select value={form.project} onChange={set('project')} required>
                <option value="">Select a project</option>
                {refs.projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assign to" required>
              <select value={form.assignedTo} onChange={set('assignedTo')} required>
                <option value="">Select an employee</option>
                {refs.employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="form__row">
            <Field label="Status">
              <select value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Due date">
            <input type="date" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete task?"
        body={`${toDelete?.title || 'This task'} and its comments will be permanently removed.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
