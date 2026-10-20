import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/Button.jsx';
import { useApiQuery } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import * as svc from '../../services/adminService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/**
 * Shared detail page for an employee or customer record: identity, account
 * flags and the work attached to them (projects, tasks, tickets or invoices).
 */
export default function RecordDetail({ kind = 'employee' }) {
  const { id } = useParams();
  const toast = useToast();
  const isEmployee = kind === 'employee';

  const fetcher = isEmployee ? svc.getEmployee : svc.getCustomer;
  const { data, loading, error, refresh } = useApiQuery(fetcher, id);
  const record = data;

  const [busy, setBusy] = useState(false);
  const [related, setRelated] = useState(null);

  const loadRelated = async () => {
    setBusy(true);
    try {
      if (isEmployee) {
        const [p, t] = await Promise.all([
          svc.listProjects({ employee: id, limit: 20 }),
          svc.listTasks({ assignedTo: id, limit: 20 }),
        ]);
        setRelated({ projects: p?.data?.items || [], tasks: t?.data?.items || [] });
      } else {
        const [p, t, i] = await Promise.all([
          svc.listProjects({ customer: id, limit: 20 }),
          svc.listTickets({ customer: id, limit: 20 }),
          svc.listInvoices({ customer: id, limit: 20 }),
        ]);
        setRelated({ projects: p?.data?.items || [], tickets: t?.data?.items || [], invoices: i?.data?.items || [] });
      }
    } catch (err) {
      toast.error(err?.message || 'Could not load related records.');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const next = !record.isActive;
      if (isEmployee) await svc.setEmployeeStatus(id, next);
      else await svc.setCustomerStatus(id, next);
      toast.success(next ? 'Account activated.' : 'Account deactivated.');
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not change status.');
    }
  };

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading record" />
        <span>Loading record…</span>
      </div>
    );
  }

  if (error || !record) {
    return (
      <>
        <PageHeader eyebrow="Directory" title={isEmployee ? 'Employee' : 'Customer'} />
        <Alert tone="error">{error || 'Record not found.'}</Alert>
        <div className="page-head__actions" style={{ marginTop: 16 }}>
          <Button to={isEmployee ? '/admin/employees' : '/admin/customers'} variant="ghost">
            Back to list
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{record.name} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={isEmployee ? 'Employee record' : 'Customer record'}
        title={record.name}
        description={record.email}
        actions={
          <>
            <Button variant="ghost" onClick={refresh}>
              Refresh
            </Button>
            <Button variant="primary" onClick={loadRelated} disabled={busy}>
              {busy ? 'Loading…' : 'Load related work'}
            </Button>
          </>
        }
      />

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Account</h2>
            <div className="chip-row">
              <StatusBadge value={record.isActive ? 'active' : 'inactive'} label={record.isActive ? 'Active' : 'Disabled'} />
              {record.mustChangePassword && <StatusBadge value="warn" label="Password change due" tone="warn" />}
            </div>
          </header>

          <dl className="kv-grid">
            <div className="kv">
              <dt className="kv__k">Role</dt>
              <dd className="kv__v mono">{record.role}</dd>
            </div>
            {isEmployee && record.employeeId && (
              <div className="kv">
                <dt className="kv__k">Employee ID</dt>
                <dd className="kv__v mono">{record.employeeId}</dd>
              </div>
            )}
            {!isEmployee && (
              <div className="kv">
                <dt className="kv__k">Company</dt>
                <dd className="kv__v">{record.companyName || '—'}</dd>
              </div>
            )}
            {isEmployee && (
              <>
                <div className="kv">
                  <dt className="kv__k">Department</dt>
                  <dd className="kv__v">{record.department || '—'}</dd>
                </div>
                <div className="kv">
                  <dt className="kv__k">Designation</dt>
                  <dd className="kv__v">{record.designation || '—'}</dd>
                </div>
                <div className="kv">
                  <dt className="kv__k">Joined</dt>
                  <dd className="kv__v">{fmt(record.joinDate || record.createdAt)}</dd>
                </div>
              </>
            )}
            <div className="kv">
              <dt className="kv__k">Phone</dt>
              <dd className="kv__v mono">{record.phone || '—'}</dd>
            </div>
            <div className="kv">
              <dt className="kv__k">Created</dt>
              <dd className="kv__v">{fmt(record.createdAt)}</dd>
            </div>
          </dl>

          <div className="page-head__actions" style={{ marginTop: 20 }}>
            <Button variant="ghost" onClick={toggleStatus} disabled={busy}>
              {record.isActive ? 'Deactivate account' : 'Activate account'}
            </Button>
            <Button to={isEmployee ? '/admin/employees' : '/admin/customers'} variant="ghost">
              Back to list
            </Button>
          </div>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Related work</h2>
            {!related && <span className="cell-sub">Not loaded yet</span>}
          </header>

          {!related && (
            <EmptyState
              title="Load their work"
              body="Fetch the projects, tasks, tickets or invoices attached to this account."
              action={
                <Button variant="primary" onClick={loadRelated} disabled={busy}>
                  {busy ? 'Loading…' : 'Load related work'}
                </Button>
              }
            />
          )}

          {related && (
            <div className="related">
              <h3 className="related__title">Projects ({related.projects.length})</h3>
              {related.projects.length ? (
                <ul className="related__list">
                  {related.projects.map((p) => (
                    <li key={p._id}>
                      <Link to={`/admin/projects/${p._id}`}>{p.title}</Link>
                      <StatusBadge value={p.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cell-sub">No projects assigned.</p>
              )}

              {isEmployee ? (
                <>
                  <h3 className="related__title">Tasks ({related.tasks.length})</h3>
                  {related.tasks.length ? (
                    <ul className="related__list">
                      {related.tasks.map((t) => (
                        <li key={t._id}>
                          <Link to={`/admin/tasks/${t._id}`}>{t.title}</Link>
                          <StatusBadge value={t.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cell-sub">No tasks assigned.</p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="related__title">Tickets ({related.tickets.length})</h3>
                  {related.tickets.length ? (
                    <ul className="related__list">
                      {related.tickets.map((t) => (
                        <li key={t._id}>
                          <Link to={`/admin/tickets/${t._id}`}>{t.subject}</Link>
                          <StatusBadge value={t.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cell-sub">No tickets raised.</p>
                  )}

                  <h3 className="related__title">Invoices ({related.invoices.length})</h3>
                  {related.invoices.length ? (
                    <ul className="related__list">
                      {related.invoices.map((i) => (
                        <li key={i._id}>
                          <Link to={`/admin/invoices/${i._id}`}>{i.number || `INV-${i._id.slice(-6)}`}</Link>
                          <StatusBadge value={i.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cell-sub">No invoices issued.</p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
