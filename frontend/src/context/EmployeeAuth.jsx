import { createAuthContext } from './createAuthContext.jsx';
import { employeeLogin, logout, me } from '../services/authService.js';

export const { AuthProvider: EmployeeAuthProvider, useAuth: useEmployeeAuth } = createAuthContext({
  role: 'employee',
  loginPath: '/employee/login',
  login: ({ email, password }) => employeeLogin(email, password),
  me: () => me('employee'),
  logout: () => logout('employee'),
});
