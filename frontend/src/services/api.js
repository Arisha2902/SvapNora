import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Single axios instance for the whole frontend.
 * - `withCredentials` so the httpOnly portal cookies (kinetic_admin,
 *   kinetic_employee, kinetic_customer) are always sent and received.
 * - `authRole` on a request config tells the interceptor which portal a 401/403
 *   belongs to, so only that portal gets logged out.
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

/* ---------------------------------------------------------------------------
 * Per-portal session handlers
 * ------------------------------------------------------------------------ */

const authFailureHandlers = new Map();

/**
 * Register what should happen when the API answers 401/403 for a given portal.
 * Returns an unsubscribe function.
 */
export function onAuthFailure(role, handler) {
  authFailureHandlers.set(role, handler);
  return () => {
    if (authFailureHandlers.get(role) === handler) authFailureHandlers.delete(role);
  };
}

/* ---------------------------------------------------------------------------
 * Error normalisation
 * ------------------------------------------------------------------------ */

function extractMessage(error) {
  const data = error.response?.data;

  if (data && typeof data.message === 'string' && data.message.trim()) return data.message;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((e) => (typeof e === 'string' ? e : e?.message || e?.msg || ''))
      .filter(Boolean)
      .join(' · ');
  }

  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error.response) return 'Could not reach the server. Check your connection and try again.';
  if (error.response.status === 429) return 'Too many requests. Please wait a moment and retry.';

  return `Request failed (${error.response.status}).`;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    const authRole = error.config?.authRole;

    const normalised = new Error(extractMessage(error));
    normalised.status = status;
    normalised.code = error.response?.data?.code || (status === 0 ? 'NETWORK_ERROR' : 'HTTP_ERROR');
    normalised.validation = error.response?.data?.errors || null;
    normalised.original = error;

    // 401 always means the portal's session is gone. A 403 does too, except when
    // the backend is only asking for a password change - that is a signed-in state,
    // not an expired one, and the guard sends the user to the profile page instead.
    const stillSignedIn = status === 403 && normalised.code === 'PASSWORD_CHANGE_REQUIRED';
    if ((status === 401 || (status === 403 && !stillSignedIn)) && authRole) {
      const handler = authFailureHandlers.get(authRole);
      if (handler) handler(normalised);
    }

    return Promise.reject(normalised);
  },
);

/* ---------------------------------------------------------------------------
 * Small helpers used by the service modules
 * ------------------------------------------------------------------------ */

/** GET with query params, dropping empty values. */
export function params(query = {}) {
  const out = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    out[key] = value;
  });
  return out;
}

/** Request scoped to a portal, so 401/403 only logs that portal out. */
export function portal(role) {
  return { authRole: role };
}

export default api;
