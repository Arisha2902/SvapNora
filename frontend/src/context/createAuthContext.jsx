import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { onAuthFailure } from '../services/api.js';

/**
 * Factory that builds one session context per portal.
 *
 * Every portal gets the same contract:
 *   status: 'loading' | 'authed' | 'guest'
 *   user, login(), logout(), refresh(), updateUser()
 *
 * Because each portal has its OWN context + cookie, signing out of the customer
 * portal never touches the employee or admin session.
 */
export function createAuthContext({ role, loginPath, login, me, logout }) {
  const Ctx = createContext(null);

  function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading');
    const [bootError, setBootError] = useState('');
    const mounted = useRef(true);

    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    /* Boot: ask the API who we are using the httpOnly cookie.
       The envelope is `{ user, mustChangePassword }` - the user object is what
       the shell renders, so unwrap it here rather than storing the wrapper. */
    const refresh = useCallback(async () => {
      try {
        const res = await me();
        if (!mounted.current) return null;
        const payload = res?.data || null;
        const nextUser = payload?.user || null;
        setUser(nextUser);
        setStatus(nextUser ? 'authed' : 'guest');
        setBootError('');
        return nextUser;
      } catch (err) {
        if (!mounted.current) return null;
        // 401/403 simply means "no valid session"; anything else is a real problem.
        setUser(null);
        setStatus('guest');
        setBootError(err?.status && err.status < 500 ? '' : err?.message || '');
        return null;
      }
    }, [me]);

    useEffect(() => {
      refresh();
    }, [refresh]);

    /* API said 401/403 for THIS portal -> drop to its login screen. */
    useEffect(
      () =>
        onAuthFailure(role, () => {
          setUser(null);
          setStatus('guest');
          navigate(loginPath, { replace: true, state: { reason: 'expired' } });
        }),
      [role, loginPath, navigate],
    );

    const doLogin = useCallback(
      async (credentials) => {
        const res = await login(credentials);
        const nextUser = res?.data?.user || null;
        setUser(nextUser);
        setStatus(nextUser ? 'authed' : 'guest');
        return res?.data || null;
      },
      [login],
    );

    const doLogout = useCallback(async () => {
      try {
        await logout();
      } catch {
        /* cookie may already be gone - local state is cleared regardless */
      }
      if (!mounted.current) return;
      setUser(null);
      setStatus('guest');
    }, [logout]);

    const updateUser = useCallback((patch) => {
      setUser((prev) => (prev ? { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) } : prev));
    }, []);

    const value = useMemo(
      () => ({
        role,
        user,
        status,
        bootError,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authed',
        mustChangePassword: Boolean(user?.mustChangePassword),
        loginPath,
        login: doLogin,
        logout: doLogout,
        refresh,
        updateUser,
      }),
      [role, user, status, bootError, loginPath, doLogin, doLogout, refresh, updateUser],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error(`useAuth(${role}) must be used inside its AuthProvider`);
    return ctx;
  }

  return { AuthProvider, useAuth };
}
