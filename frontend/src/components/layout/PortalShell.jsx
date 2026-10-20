import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import {
  IconBriefcase,
  IconBolt,
  IconBuilding,
  IconClose,
  IconCode,
  IconGlobe,
  IconMail,
  IconMenu,
  IconMoon,
  IconStore,
  IconSun,
  IconTrending,
  IconUser,
} from '../icons.jsx';

const NAV_ICONS = {
  IconBolt,
  IconBriefcase,
  IconBuilding,
  IconCode,
  IconGlobe,
  IconMail,
  IconStore,
  IconTrending,
  IconUser,
};

/**
 * Shared chrome for the employee and customer portals: fixed sidebar on
 * desktop, drawer + bottom tab bar on mobile, topbar with theme toggle and
 * sign-out. Each portal passes its own nav items, so nothing about one portal
 * leaks into the other.
 */
export default function PortalShell({ portalName, navItems, user, onLogout, theme, onToggleTheme, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const iconFor = (name) => {
    const Icon = NAV_ICONS[name] || IconBolt;
    return <Icon size={17} />;
  };

  const signOut = async () => {
    setOpen(false);
    await onLogout();
    navigate('/'); // back to the public site, never into another portal
  };

  return (
    <div className={`portal portal--${portalName}`}>
      <aside className={`portal__side${open ? ' is-open' : ''}`} aria-label="Portal navigation">
        <div className="portal__side-head">
          <NavLink to="/" className="portal__brand" onClick={() => setOpen(false)}>
            SvapNora<span className="logo-chevron">&gt;</span>
          </NavLink>
          <button className="icon-btn portal__side-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <IconClose />
          </button>
        </div>

        <nav className="portal__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `portal__nav-item${isActive ? ' is-active' : ''}`}
            >
              <span className="portal__nav-icon" aria-hidden="true">
                {iconFor(item.icon)}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="portal__side-foot">
          <button className="portal__nav-item portal__nav-item--btn" onClick={signOut}>
            <span className="portal__nav-icon" aria-hidden="true">
              <IconClose size={17} />
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && <button className="portal__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="portal__body">
        <header className="portal__top">
          <button className="icon-btn portal__burger" onClick={() => setOpen(true)} aria-label="Open menu">
            <IconMenu />
          </button>

          <p className="portal__top-title">{portalName}</p>

          <div className="portal__top-actions">
            {onToggleTheme && (
              <button
                className="icon-btn portal__theme"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </button>
            )}
            <span className="portal__user" title={user?.email || ''}>
              <span className="portal__user-avatar" aria-hidden="true">
                <IconUser size={16} />
              </span>
              <span className="portal__user-name">{user?.name || 'Account'}</span>
            </span>
            <button className="btn btn--ghost portal__logout" onClick={signOut}>
              <span className="btn__label">Sign out</span>
            </button>
          </div>
        </header>

        <main className="portal__main" id="main">
          {children ?? <Outlet />}
        </main>
      </div>

      <nav className="portal__tabs" aria-label="Portal sections">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `portal__tab${isActive ? ' is-active' : ''}`}
          >
            <span className="portal__tab-icon" aria-hidden="true">
              {iconFor(item.icon)}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
