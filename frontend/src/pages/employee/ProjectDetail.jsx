import { useEffect, useState } from 'react';
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
import {
  getProject,
  listProjectMessages,
  sendProjectMessage,
} from '../../services/employeeService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default function EmployeeProjectDetail() {
  const { id } = useParams();
  const toast = useToast();

  const { data: project, loading, error, refresh } = useApiQuery(getProject, id);
  const [messages, setMessages] = useState([]);
  const [msgError, setMsgError] = useState('');
  const [msgLoading, setMsgLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = () => {
    setMsgLoading(true);
    listProjectMessages(id, { limit: 50 })
      .then((res) => {
        setMessages(res?.data?.items || []);
        setMsgError('');
      })
      .catch((err) => setMsgError(err?.message || 'Could not load the conversation.'))
      .finally(() => setMsgLoading(false));
  };

  useEffect(() => {
    if (project) loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id]);

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendProjectMessage(id, draft.trim());
      setDraft('');
      loadMessages();
    } catch (err) {
      toast.error(err?.message || 'Could not send your message.');
    } finally {
      setSending(false);
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
          <Button to="/employee/projects" variant="ghost">
            Back to my projects
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{project.title} · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={`Project · ${project.category}`}
        title={project.title}
        description={project.shortDescription}
        actions={
          <Button to="/employee/projects" variant="ghost">
            Back to projects
          </Button>
        }
      />

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Overview</h2>
            <StatusBadge value={project.status} />
          </header>

          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Client</dt>
              <dd className="kv__v">
                {project.customer?.companyName || project.customer?.name || '—'}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Timeline</dt>
              <dd className="kv__v">
                {fmt(project.startDate)} → {fmt(project.dueDate)}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Team size</dt>
              <dd className="kv__v mono">{project.teamSize ?? (project.assignedEmployees || []).length}</dd>
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

          <p className="prose">{project.fullDescription || project.shortDescription}</p>

          <h3 className="related__title">My tasks on this project ({(project.myTasks || []).length})</h3>
          {(project.myTasks || []).length ? (
            <ul className="related__list">
              {project.myTasks.map((t) => (
                <li key={t._id}>
                  <Link to={`/employee/tasks/${t._id}`}>{t.title}</Link>
                  <span className="chip-row">
                    <StatusBadge value={t.priority} />
                    <StatusBadge value={t.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cell-sub">No tasks assigned to you on this project.</p>
          )}
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Project conversation</h2>
            <button type="button" className="linkish" onClick={loadMessages}>
              Refresh
            </button>
          </header>

          {msgError && <Alert tone="error">{msgError}</Alert>}

          {msgLoading ? (
            <div className="route-fallback" role="status" style={{ minHeight: '30vh' }}>
              <Spinner label="Loading messages" />
              <span>Loading conversation…</span>
            </div>
          ) : (
            <ul className="thread">
              {messages.length === 0 && <li className="cell-sub">No messages yet. Start the conversation.</li>}
              {messages.map((m) => (
                <li className={`thread__item${m.senderRole === 'customer' ? '' : ' thread__item--staff'}`} key={m._id}>
                  <div className="thread__meta">
                    <strong>{m.sender?.name || 'Team member'}</strong>
                    <span className="cell-sub">
                      {m.senderRole === 'customer' ? m.sender?.companyName || 'Client' : 'SvapNora team'} · {fmtTime(m.createdAt)}
                    </span>
                  </div>
                  <p className="thread__body">{m.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form className="form" onSubmit={send}>
            <Field label="Send a message to the project team">
              <textarea
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share an update, blocker or question…"
              />
            </Field>
            <Button type="submit" variant="primary" disabled={sending || !draft.trim()}>
              {sending ? 'Sending…' : 'Send message'}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
