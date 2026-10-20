import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import {
  IconBolt,
  IconBriefcase,
  IconBuilding,
  IconClose,
  IconCode,
  IconGauge,
  IconGlobe,
  IconMail,
  IconMenu,
  IconMoon,
  IconSun,
  IconTrending,
  IconUsers,
} from '../icons.jsx';

const NAV_ICONS = {
  IconBolt,
  IconBriefcase,
  IconBuilding,
  IconCode,
  IconGauge,
  IconGlobe,
  IconMail,
  IconTrending,
  IconUsers,
};

const GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: 'IconBolt', end: true }],
  },
  {
    label: 'Directory',
    items: [
      { to: '/admin/employees', label: 'Employees', icon: 'IconUsers' },
      { to: '/admin/customers', label: 'Customers', icon: 'IconBuilding' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { to: '/admin/projects', label: 'Projects', icon: 'IconBriefcase' },
      { to: '/admin/tasks', label: 'Tasks', icon: 'IconCode' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/inquiries', label: 'Inquiries', icon: 'IconMail' },
      { to: '/admin/tickets', label: 'Tickets', icon: 'IconGlobe' },
      { to: '/admin/announcements', label: 'Announcements', icon: 'IconGauge' },
    ],
  },
  {
    label: 'Finance & HR',
    items: [
      { to: '/admin/invoices', label: 'Invoices', icon: 'IconTrending' },
      { to: '/admin/leaves', label: 'Leave requests', icon: 'IconBuilding' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/audit', label: 'Activity log', icon: 'IconGauge' },
      { to: '/admin/profile', label: 'Profile', icon: 'IconUsers' },
      { to: '/admin/settings', label: 'Settings', icon: 'IconCode' },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

/**
 * Admin chrome. Deliberately its own component - the admin panel shares no
 * layout code with the public site, the employee portal or the customer portal,
 * so a mistake in one can never widen access in another.
 */
export default function AdminShell({ user, onLogout, theme, onToggleTheme, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const iconFor = (name) => {
    const Icon = NAV_ICONS[name] || IconBolt;
    return <Icon size={16} />;
  };

  const signOut = async () => {
    setOpen(false);
    await onLogout();
    navigate('/admin/login');
  };

  const renderItems = (items) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => setOpen(false)}
        className={({ isActive }) => `admin__nav-item${isActive ? ' is-active' : ''}`}
      >
        <span className="admin__nav-icon" aria-hidden="true">
          {iconFor(item.icon)}
        </span>
        <span>{item.label}</span>
      </NavLink>
    ));

  return (
    <div className="admin">
      <aside className={`admin__side${open ? ' is-open' : ''}`} aria-label="Admin navigation">
        <div className="admin__side-head">
          <NavLink to="/" className="admin__brand" onClick={() => setOpen(false)} tabIndex={-1}>
            SvapNora<span className="logo-chevron">&gt;</span>
          </NavLink>
          <span className="admin__env">ADMIN</span>
          <button className="icon-btn admin__side-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <IconClose />
          </button>
        </div>

        <nav className="admin__nav">
          {GROUPS.map((group) => (
            <div className="admin__group" key={group.label}>
              <p className="admin__group-label">{group.label}</p>
              {renderItems(group.items)}
            </div>
          ))}
        </nav>

        <div className="admin__side-foot">
          <button className="admin__nav-item admin__nav-item--btn" onClick={signOut}>
            <span className="admin__nav-icon" aria-hidden="true">
              <IconClose size={16} />
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && <button className="admin__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="admin__body">
        <header className="admin__top">
          <button className="icon-btn admin__burger" onClick={() => setOpen(true)} aria-label="Open menu">
            <IconMenu />
          </button>
          <p className="admin__top-title">Control Room</p>
          <div className="admin__top-actions">
            {onToggleTheme && (
              <button
                className="icon-btn"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </button>
            )}
            <span className="admin__user" title={user?.email || ''}>
              {user?.name || 'Administrator'}
            </span>
            <button className="btn btn--ghost admin__logout" onClick={signOut}>
              <span className="btn__label">Sign out</span>
            </button>
          </div>
        </header>

        <main className="admin__main" id="main">
          {children ?? <Outlet />}
        </main>
      </div>

      <nav className="admin__tabs" aria-label="Admin sections">
        {ALL_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `admin__tab${isActive ? ' is-active' : ''}`}
          >
            <span aria-hidden="true">{iconFor(item.icon)}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
