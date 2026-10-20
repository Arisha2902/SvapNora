import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { BarChart, Breakdown } from '../../components/admin/Charts.jsx';
import { stats, charts } from '../../services/adminService.js';

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([stats(), charts()]).then(([s, c]) => {
      if (!alive) return;
      if (s.status === 'fulfilled') setData(s.value?.data);
      else setError(s.reason?.message || 'Could not load dashboard statistics.');
      if (c.status === 'fulfilled') setChart(c.value?.data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading dashboard" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Control room"
        title="Dashboard"
        description="Live operational numbers across delivery, support, sales intake and finance."
        actions={
          <Link className="btn btn--ghost" to="/admin/inquiries">
            <span className="btn__label">Review inquiries</span>
            <span className="btn__arrow" aria-hidden="true">
              &gt;
            </span>
          </Link>
        }
      />

      {error && (
        <Alert tone="error" className="reveal">
          {error}
        </Alert>
      )}

      {data && (
        <>
          <div className="stat-grid reveal">
            <StatCard label="Employees" value={data.employees?.total ?? 0} hint={`${data.employees?.active ?? 0} active`} tone="info" />
            <StatCard label="Customers" value={data.customers?.total ?? 0} hint="Registered accounts" />
            <StatCard
              label="Projects"
              value={data.projects?.active ?? 0}
              hint={`${data.projects?.published ?? 0} published · ${data.projects?.completed ?? 0} completed`}
              tone="ok"
            />
            <StatCard label="Open tasks" value={data.tasks?.open ?? 0} hint="Todo / in progress / review" />
            <StatCard
              label="Inquiries"
              value={data.inquiries?.new ?? 0}
              hint={`${data.inquiries?.last30Days ?? 0} in the last 30 days`}
              tone="warn"
            />
            <StatCard
              label="Tickets"
              value={data.tickets?.open ?? 0}
              hint={`${data.tickets?.inProgress ?? 0} in progress · ${data.tickets?.resolved ?? 0} resolved`}
              tone="info"
            />
            <StatCard label="Leave pending" value={data.leaves?.pending ?? 0} hint="Awaiting your review" tone="warn" />
            <StatCard
              label="Revenue (paid)"
              value={fmtMoney(data.invoices?.revenue)}
              hint={`${data.invoices?.pending ?? 0} pending · ${data.invoices?.overdue ?? 0} overdue`}
              tone="ok"
            />
          </div>

          <div className="panel-grid reveal">
            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Inquiries</h2>
              </header>
              <BarChart points={chart?.inquiriesPerWeek || []} />
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Projects by status</h2>
              </header>
              <Breakdown
                rows={chart?.projectsByStatus || []}
                labelMap={{
                  planning: 'Planning',
                  'in-progress': 'In progress',
                  review: 'In review',
                  completed: 'Completed',
                  'on-hold': 'On hold',
                }}
              />
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Tasks by status</h2>
              </header>
              <Breakdown
                rows={chart?.tasksByStatus || []}
                labelMap={{ todo: 'To do', 'in-progress': 'In progress', review: 'Review', done: 'Done' }}
              />
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Tickets by status</h2>
              </header>
              <Breakdown
                rows={chart?.ticketsByStatus || []}
                labelMap={{ open: 'Open', 'in-progress': 'In progress', resolved: 'Resolved', closed: 'Closed' }}
              />
            </section>
          </div>

          <div className="panel-grid panel-grid--wide reveal">
            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Latest inquiries</h2>
                <Link className="link-arrow" to="/admin/inquiries">
                  All inquiries <span className="arrow">&gt;</span>
                </Link>
              </header>
              {data.recentInquiries?.length ? (
                <ul className="feed">
                  {data.recentInquiries.map((i) => (
                    <li className="feed__item" key={i._id}>
                      <div>
                        <strong>{i.name}</strong>
                        <span className="feed__meta">
                          {i.email} · {i.type} · {fmtDate(i.createdAt)}
                        </span>
                      </div>
                      <StatusBadge value={i.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No inquiries yet" body="Submissions from the contact form appear here." />
              )}
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Recent activity</h2>
                <Link className="link-arrow" to="/admin/audit">
                  Full log <span className="arrow">&gt;</span>
                </Link>
              </header>
              {data.recentActivity?.length ? (
                <ul className="feed">
                  {data.recentActivity.map((a) => (
                    <li className="feed__item" key={a._id}>
                      <div>
                        <strong>{a.summary || `${a.action} ${a.entity}`}</strong>
                        <span className="feed__meta">
                          {a.actorName || 'System'} · {a.action} · {fmtDate(a.timestamp)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No activity recorded" body="Administrative actions are written to the audit trail." />
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
