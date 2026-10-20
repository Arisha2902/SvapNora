import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { stats } from '../../services/employeeService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No due date');

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    stats()
      .then((res) => {
        if (alive) setData(res?.data);
      })
      .catch((err) => {
        if (alive) setError(err?.message || 'Could not load your dashboard.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="route-fallback" role="status">
        <Spinner label="Loading dashboard" />
        <span>Loading your dashboard…</span>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="My work"
        title="Dashboard"
        description="Everything assigned to you today - tasks, projects, leave and company news."
        actions={
          <Link className="btn btn--ghost" to="/employee/tasks">
            <span className="btn__label">Open my tasks</span>
            <span className="btn__arrow" aria-hidden="true">
              &gt;
            </span>
          </Link>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Open tasks" value={data.tasks?.open ?? 0} hint="To do and in review" tone="warn" />
            <StatCard label="In progress" value={data.tasks?.inProgress ?? 0} hint="Actively being worked on" tone="info" />
            <StatCard label="Done" value={data.tasks?.done ?? 0} hint="Completed tasks" tone="ok" />
            <StatCard label="Projects" value={data.projects?.active ?? 0} hint={`${data.projects?.total ?? 0} total assigned`} />
            <StatCard label="Leave pending" value={data.leaves?.pending ?? 0} hint={`${data.leaves?.approved ?? 0} approved so far`} />
            <StatCard label="News" value={data.announcements?.new ?? 0} hint="New in the last 7 days" tone="info" />
          </div>

          <div className="panel-grid panel-grid--wide">
            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Upcoming tasks</h2>
                <Link className="link-arrow" to="/employee/tasks">
                  All tasks <span className="arrow">&gt;</span>
                </Link>
              </header>
              {data.upcomingTasks?.length ? (
                <ul className="feed">
                  {data.upcomingTasks.map((t) => (
                    <li className="feed__item" key={t._id}>
                      <div>
                        <strong>
                          <Link to={`/employee/tasks/${t._id}`}>{t.title}</Link>
                        </strong>
                        <span className="feed__meta">
                          {t.project?.title || 'No project'} · due {fmt(t.dueDate)}
                        </span>
                      </div>
                      <StatusBadge value={t.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Nothing due" body="New tasks assigned to you appear here." action={<Link className="btn btn--ghost" to="/employee/tasks">View all tasks</Link>} />
              )}
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="panel__title">Latest news</h2>
                <Link className="link-arrow" to="/employee/announcements">
                  All news <span className="arrow">&gt;</span>
                </Link>
              </header>
              {data.announcements?.latest?.length ? (
                <ul className="feed">
                  {data.announcements.latest.map((a) => (
                    <li className="feed__item" key={a._id}>
                      <div>
                        <strong>
                          <Link to={`/employee/announcements/${a._id}`}>{a.title}</Link>
                        </strong>
                        <span className="feed__meta cell-clamp">{a.body}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No news yet" body="Announcements from the team appear here." />
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
