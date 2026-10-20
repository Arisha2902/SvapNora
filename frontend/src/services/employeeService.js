import { api, params, portal } from './api.js';

const R = portal('employee');
const enc = encodeURIComponent;

export function stats() {
  return api.get('/employee/stats', R).then((r) => r.data);
}

export function getProfile() {
  return api.get('/employee/profile', R).then((r) => r.data);
}

export function updateProfile(payload) {
  return api.patch('/employee/profile', payload, R).then((r) => r.data);
}

export function changePassword(currentPassword, newPassword, confirmPassword) {
  return api
    .post('/employee/profile/change-password', { currentPassword, newPassword, confirmPassword }, R)
    .then((r) => r.data);
}

/* -------------------------------- projects ------------------------------ */

export function listProjects(query = {}) {
  return api.get('/employee/projects', { ...R, params: params(query) }).then((r) => r.data);
}

export function getProject(id) {
  return api.get(`/employee/projects/${enc(id)}`, R).then((r) => r.data);
}

export function listProjectMessages(projectId, query = {}) {
  return api.get(`/employee/projects/${enc(projectId)}/messages`, { ...R, params: params(query) }).then((r) => r.data);
}

export function sendProjectMessage(projectId, body) {
  return api.post(`/employee/projects/${enc(projectId)}/messages`, { body }, R).then((r) => r.data);
}

/* --------------------------------- tasks -------------------------------- */

export function listTasks(query = {}) {
  return api.get('/employee/tasks', { ...R, params: params(query) }).then((r) => r.data);
}

export function getTask(id) {
  return api.get(`/employee/tasks/${enc(id)}`, R).then((r) => r.data);
}



export function setTaskStatus(id, status) {
  return api.patch(`/employee/tasks/${enc(id)}/status`, { status }, R).then((r) => r.data);
}

export function addTaskComment(id, text) {
  return api.post(`/employee/tasks/${enc(id)}/comments`, { text }, R).then((r) => r.data);
}

/* --------------------------------- leaves ------------------------------- */

export function listLeaves(query = {}) {
  return api.get('/employee/leaves', { ...R, params: params(query) }).then((r) => r.data);
}

export function createLeave(payload) {
  return api.post('/employee/leaves', payload, R).then((r) => r.data);
}

export function getLeave(id) {
  return api.get(`/employee/leaves/${enc(id)}`, R).then((r) => r.data);
}

export function cancelLeave(id) {
  return api.patch(`/employee/leaves/${enc(id)}/cancel`, {}, R).then((r) => r.data);
}

/* ----------------------------- announcements ---------------------------- */

export function listAnnouncements(query = {}) {
  return api.get('/employee/announcements', { ...R, params: params(query) }).then((r) => r.data);
}

/* -------------------------------- messages ------------------------------ */

export function getAnnouncement(id) {
  return api.get(`/employee/announcements/${enc(id)}`, R).then((r) => r.data);
}
