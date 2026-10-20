import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import Button from './Button.jsx';
import { IconClose, IconMenu, IconMoon, IconSun } from './icons.jsx';

const NAV_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'Products', to: '/products' },
  { label: 'GlowLang', to: '/glowlang' },
  { label: 'About Us', to: '/about' },
];

/* Employee portal sign-in. The admin entrance is never listed here. */
const EMPLOYEE_LOGIN = { label: 'Employee portal', to: '/employee/login' };

/**
 * Sticky black navigation.
 * Desktop: wordmark / centred links / theme toggle + CTA.
 * Mobile: hamburger / wordmark / theme toggle / compact "DISCUSS >",
 * with a full-screen menu overlay.
 */
export default function Navbar({ theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Route change closes the menu
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <button
            className="icon-btn nav__burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>

          <Link to="/" className="nav__logo" aria-label="SvapNora — home">
            <img
              src="/logo-mark.png"
              alt=""
              className="nav__logo-mark"
              width="30"
              height="30"
            />
            <span className="nav__logo-text">vapNora</span>
          </Link>

          <nav className="nav__links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav__actions">
            <button
              className="icon-btn nav__theme"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>

            <Button to="/contact" variant="primary" className="nav__cta-full" ariaLabel="Discuss your project">
              Discuss Your Project
            </Button>
            <Button to="/contact" variant="primary" className="nav__cta-compact" ariaLabel="Discuss your project">
              Discuss
            </Button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu rendered outside header to avoid stacking context & backdrop-filter clipping */}
      <div className={`mobile-menu${open ? ' is-open' : ''}`} id="mobile-menu" aria-hidden={!open}>
        <nav className="mobile-menu__links" aria-label="Mobile">
          {NAV_LINKS.map((l, i) => (
            <NavLink key={l.to} to={l.to} onClick={closeMenu}>
              <span>0{i + 1}</span>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/contact" onClick={closeMenu}>
            <span>05</span>
            Contact
          </NavLink>
        </nav>

        <div className="mobile-menu__logins">
          <Link to={EMPLOYEE_LOGIN.to} onClick={closeMenu}>
            {EMPLOYEE_LOGIN.label}
          </Link>
        </div>

        <Button to="/contact" variant="primary" onClick={closeMenu}>
          Discuss Your Project
        </Button>
      </div>
    </>
  );
}
