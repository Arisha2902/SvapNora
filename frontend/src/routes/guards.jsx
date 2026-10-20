import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAdminAuth } from '../context/AdminAuth.jsx';
import { useEmployeeAuth } from '../context/EmployeeAuth.jsx';
import Spinner from '../components/ui/Spinner.jsx';

/**
 * One guard factory for the portals.
 *
 * States handled:
 *  - still checking the cookie  → spinner
 *  - not signed in              → redirect to that portal's login (remembering where
 *                                 the user was headed)
 *  - mustChangePassword         → force the profile page (the API blocks everything else)
 *  - otherwise                  → render the route
 */
function createGuard({ useAuth, loginPath, basePath }) {
  return function RequireRole({ children }) {
    const { status, isAuthenticated, mustChangePassword } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
      return (
        <div className="route-fallback" role="status" aria-live="polite">
          <Spinner label="Checking your session" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <Navigate
          to={loginPath}
          replace
          state={{ from: `${location.pathname}${location.search}` }}
        />
      );
    }

    if (mustChangePassword && location.pathname !== `${basePath}/profile`) {
      return (
        <Navigate
          to={`${basePath}/profile`}
          replace
          state={{ reason: 'password', next: `${location.pathname}${location.search}` }}
        />
      );
    }

    return children ?? <Outlet />;
  };
}

export const RequireAdmin = createGuard({
  useAuth: useAdminAuth,
  loginPath: '/admin/login',
  basePath: '/admin',
});

export const RequireEmployee = createGuard({
  useAuth: useEmployeeAuth,
  loginPath: '/employee/login',
  basePath: '/employee',
});

/**
 * Inverse guard: an already signed-in user should not sit on a login screen.
 * Used by /admin/login and /employee/login.
 */
function createGuestGuard({ useAuth, homePath }) {
  return function RequireGuest({ children }) {
    const { status, isAuthenticated } = useAuth();

    if (status === 'loading') {
      return (
        <div className="route-fallback" role="status" aria-live="polite">
          <Spinner label="Checking your session" />
        </div>
      );
    }

    if (isAuthenticated) return <Navigate to={homePath} replace />;
    return children;
  };
}

export const RequireAdminGuest = createGuestGuard({ useAuth: useAdminAuth, homePath: '/admin/dashboard' });
export const RequireEmployeeGuest = createGuestGuard({
  useAuth: useEmployeeAuth,
  homePath: '/employee/dashboard',
});
