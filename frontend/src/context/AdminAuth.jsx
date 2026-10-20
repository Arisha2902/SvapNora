import { createAuthContext } from './createAuthContext.jsx';
import { adminLogin, logout, me } from '../services/authService.js';

export const { AuthProvider: AdminAuthProvider, useAuth: useAdminAuth } = createAuthContext({
  role: 'admin',
  loginPath: '/admin/login',
  login: ({ email, password }) => adminLogin(email, password),
  me: () => me('admin'),
  logout: () => logout('admin'),
});
