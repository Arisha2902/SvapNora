import { api, portal } from './api.js';

const ROLE_PATH = { admin: 'admin', employee: 'employee' };

/* ----------------------------- logins ---------------------------------- */

export function adminLogin(email, password) {
  return api.post('/auth/admin/login', { email, password }, portal('admin')).then((r) => r.data);
}

export function employeeLogin(email, password) {
  return api.post('/auth/employee/login', { email, password }, portal('employee')).then((r) => r.data);
}

/* ----------------------------- session --------------------------------- */

export function me(role) {
  return api.get(`/auth/${ROLE_PATH[role]}/me`, portal(role)).then((r) => r.data);
}

export function logout(role) {
  return api.post(`/auth/${ROLE_PATH[role]}/logout`, {}, portal(role)).then((r) => r.data);
}

/* --------------------------- passwords --------------------------------- */

export function forgotPassword(role, email) {
  return api
    .post(`/auth/${ROLE_PATH[role]}/forgot-password`, { email }, portal(role))
    .then((r) => r.data);
}

export function resetPassword(role, token, password, confirmPassword) {
  return api
    .post(
      `/auth/${ROLE_PATH[role]}/reset-password/${encodeURIComponent(token)}`,
      { password, confirmPassword },
      portal(role),
    )
    .then((r) => r.data);
}

export function changePassword(role, currentPassword, newPassword, confirmPassword) {
  return api
    .post(`/auth/${ROLE_PATH[role]}/change-password`, { currentPassword, newPassword, confirmPassword }, portal(role))
    .then((r) => r.data);
}
