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
import { getTicket, replyTicket, setTicketPriority, setTicketStatus } from '../../services/adminService.js';

const STATUSES = ['open', 'in-progress', 'resolved'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminTicketDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: ticket, loading, error, refresh } = useApiQuery(getTicket, id);

  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState('');
  const [formError, setFormError] = useState('');

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

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await run(async () => {
      await replyTicket(id, reply.trim());
      setReply('');
    }, 'Reply sent.');
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading ticket" />
        <span>Loading ticket…</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <>
        <PageHeader eyebrow="Support" title="Ticket" />
        <Alert tone="error">{error || 'Ticket not found.'}</Alert>
        <div style={{ marginTop: 16 }}>
          <Button to="/admin/tickets" variant="ghost">
            Back to tickets
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{ticket.subject} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={`Ticket · ${ticket.category || 'support'}`}
        title={ticket.subject}
        description={ticket.description}
        actions={
          <Button to="/admin/tickets" variant="ghost">
            Back to tickets
          </Button>
        }
      />

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Ticket</h2>
            <div className="chip-row">
              <StatusBadge value={ticket.status} />
              <StatusBadge value={ticket.priority} />
            </div>
          </header>

          {formError && <Alert tone="error">{formError}</Alert>}

          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Client</dt>
              <dd className="kv__v">
                {ticket.customer ? (
                  <Link to={`/admin/customers/${ticket.customer._id}`}>{ticket.customer.name}</Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Project</dt>
              <dd className="kv__v">
                {ticket.project ? <Link to={`/admin/projects/${ticket.project._id}`}>{ticket.project.title}</Link> : '—'}
              </dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Opened</dt>
              <dd className="kv__v">{fmt(ticket.createdAt)}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Last update</dt>
              <dd className="kv__v">{fmt(ticket.updatedAt)}</dd>
            </div>
          </dl>

          <div className="form__row">
            <Field label="Status">
              <select value={ticket.status} disabled={busy} onChange={(e) => run(() => setTicketStatus(id, e.target.value), 'Status updated.')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={ticket.priority}
                disabled={busy}
                onChange={(e) => run(() => setTicketPriority(id, e.target.value), 'Priority updated.')}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Conversation ({(ticket.replies || []).length})</h2>
          </header>

          <ul className="thread">
            {(ticket.replies || []).length === 0 && <li className="cell-sub">No replies yet.</li>}
            {(ticket.replies || []).map((r, i) => (
              <li className={`thread__item${r.role === 'customer' ? '' : ' thread__item--staff'}`} key={r._id || i}>
                <div className="thread__meta">
                  <strong>{r.author?.name || (r.role === 'customer' ? 'Client' : 'Team member')}</strong>
                  <span className="cell-sub">
                    {r.role === 'customer' ? 'Client' : 'SvapNora team'} · {fmt(r.at || r.createdAt)}
                  </span>
                </div>
                <p className="thread__body">{r.body}</p>
              </li>
            ))}
          </ul>

          <form className="form" onSubmit={sendReply}>
            <Field label="Reply to the client">
              <textarea
                rows={4}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply the client will see in their portal…"
              />
            </Field>
            <Button type="submit" variant="primary" disabled={busy || !reply.trim()}>
              {busy ? 'Sending…' : 'Send reply'}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
