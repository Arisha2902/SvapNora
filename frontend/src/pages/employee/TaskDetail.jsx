import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/Button.jsx';
import { Field } from '../../components/admin/FilterBar.jsx';
import { useApiQuery } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { addTaskComment, getTask, setTaskStatus } from '../../services/employeeService.js';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function EmployeeTaskDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: task, loading, error, refresh } = useApiQuery(getTask, id);

  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');

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
          <Button to="/employee/tasks" variant="ghost">
            Back to my tasks
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{task.title} · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={`Task · ${task.project?.title || 'No project'}`}
        title={task.title}
        description={task.description || 'No description.'}
        actions={
          <Button to="/employee/tasks" variant="ghost">
            Back to tasks
          </Button>
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
                {task.project ? <Link to={`/employee/projects/${task.project._id}`}>{task.project.title}</Link> : '—'}
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
              <dd className="kv__v">{fmtDay(task.dueDate)}</dd>
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
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Note progress, blockers or a question for the team…"
              />
            </Field>
            <Button type="submit" variant="primary" disabled={busy || !comment.trim()}>
              {busy ? 'Posting…' : 'Post comment'}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
