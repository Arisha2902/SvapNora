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
import {
  addTaskComment,
  deleteTask,
  getTask,
  setTaskStatus,
  updateTask,
} from '../../services/adminService.js';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const toISO = (d) => (d ? String(d).slice(0, 10) : '');

export default function AdminTaskDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: task, loading, error, refresh } = useApiQuery(getTask, id);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [formError, setFormError] = useState('');
  const [comment, setComment] = useState('');
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
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: toISO(task.dueDate),
    });
    setFormError('');
    setEditing(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await updateTask(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      toast.success('Task updated.');
      setEditing(false);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await addTaskComment(id, comment.trim());
      setComment('');
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not post the comment.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteTask(id);
      toast.success('Task deleted.');
      navigate('/admin/tasks');
    } catch (err) {
      toast.error(err?.message || 'Could not delete this task.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading task" />
        <span>Loading task…</span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <>
        <PageHeader eyebrow="Delivery" title="Task" />
        <Alert tone="error">{error || 'Task not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/admin/tasks" variant="ghost">
            Back to tasks
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{task.title} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={`Task · ${task.project?.title || 'No project'}`}
        title={task.title}
        description={task.description || 'No description.'}
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
            <h2 className="panel__title">Details</h2>
            <StatusBadge value={task.status} />
          </header>

          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Project</dt>
              <dd className="kv__v">
                {task.project ? <Link to={`/admin/projects/${task.project._id}`}>{task.project.title}</Link> : '—'}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Owner</dt>
              <dd className="kv__v">
                {task.assignedTo ? <Link to={`/admin/employees/${task.assignedTo._id}`}>{task.assignedTo.name}</Link> : '—'}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Priority</dt>
              <dd className="kv__v">
                <StatusBadge value={task.priority} />
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Due</dt>
              <dd className="kv__v">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Updated</dt>
              <dd className="kv__v">{fmt(task.updatedAt)}</dd>
            </div>
          </dl>

          <Field label="Move to">
            <select
              value={task.status}
              disabled={busy}
              onChange={(e) => run(() => setTaskStatus(id, e.target.value), 'Status updated.')}
            >
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
            <h2 className="panel__title">Comments ({(task.comments || []).length})</h2>
          </header>

          <ul className="thread">
            {(task.comments || []).length === 0 && <li className="cell-sub">No comments yet.</li>}
            {(task.comments || []).map((c, i) => (
              <li className="thread__item" key={c._id || i}>
                <div className="thread__meta">
                  <strong>{c.user?.name || 'Team member'}</strong>
                  <span className="cell-sub">{fmt(c.at || c.createdAt)}</span>
                </div>
                <p className="thread__body">{c.text}</p>
              </li>
            ))}
          </ul>

          <form className="form" onSubmit={postComment}>
            <Field label="Add a comment">
              <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write an update for the team…" />
            </Field>
            <Button type="submit" variant="primary" disabled={busy || !comment.trim()}>
              {busy ? 'Posting…' : 'Post comment'}
            </Button>
          </form>
        </section>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit task"
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
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required minLength={3} />
          </Field>
          <Field label="Description">
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="form__row">
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete}
        title="Delete task?"
        body="This task and its comments will be permanently removed."
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(false)}
      />
    </>
  );
}
