import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/**
 * Fixed bottom tab bar shown on public routes below the 1024px breakpoint.
 * Mirrors the primary navigation so the mobile menu is never mandatory.
 */
export default function PublicBottomNav({ items = TABS }) {
  return (
    <nav className="bottom-tabs" aria-label="Quick navigation">
      {items.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) => `bottom-tabs__item${isActive ? ' is-active' : ''}`}
        >
          <span className="bottom-tabs__dot" aria-hidden="true" />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
