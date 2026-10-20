import { Outlet, useLocation } from 'react-router-dom';

import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import PublicBottomNav from '../components/layout/PublicBottomNav.jsx';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { useReveal } from '../hooks/useReveal.js';

/**
 * Chrome for every public route: skip link → sticky navbar → page → footer →
 * mobile bottom tab bar.
 * `useReveal` runs once here and keeps watching for newly mounted `.reveal`
 * elements, so pages that lazy-load or fetch data still animate in.
 */
export default function PublicLayout() {
  const { theme, toggle } = useThemeContext();
  const { pathname } = useLocation();
  useReveal();

  // Sections publish their own ids; make sure a fresh page starts at the top.
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main id="main" key={pathname}>
        <Outlet />
      </main>
      <Footer />
      <PublicBottomNav />
    </>
  );
}
