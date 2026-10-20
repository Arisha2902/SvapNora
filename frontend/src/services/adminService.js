import { api, params, portal } from './api.js';

const R = portal('admin');
const enc = encodeURIComponent;

/* ---------------------------- dashboard -------------------------------- */

export function stats() {
  return api.get('/admin/stats', R).then((r) => r.data);
}

export function charts() {
  return api.get('/admin/charts', R).then((r) => r.data);
}

export function auditLogs(query = {}) {
  return api.get('/admin/audit-logs', { ...R, params: params(query) }).then((r) => r.data);
}

/* ------------------------------- profile -------------------------------- */

export function getProfile() {
  return api.get('/admin/profile', R).then((r) => r.data);
}

export function updateProfile(payload) {
  return api.patch('/admin/profile', payload, R).then((r) => r.data);
}

export function changePassword(currentPassword, newPassword, confirmPassword) {
  return api
    .post('/admin/profile/change-password', { currentPassword, newPassword, confirmPassword }, R)
    .then((r) => r.data);
}

export function getSettings() {
  return api.get('/admin/settings', R).then((r) => r.data);
}

/* ------------------------------ employees ------------------------------- */

export function listEmployees(query = {}) {
  return api.get('/admin/employees', { ...R, params: params(query) }).then((r) => r.data);
}

export function getEmployee(id) {
  return api.get(`/admin/employees/${enc(id)}`, R).then((r) => r.data);
}

export function createEmployee(payload) {
  return api.post('/admin/employees', payload, R).then((r) => r.data);
}

export function updateEmployee(id, payload) {
  return api.patch(`/admin/employees/${enc(id)}`, payload, R).then((r) => r.data);
}

export function resetEmployeePassword(id, newPassword, mustChangePassword = true) {
  return api
    .post(`/admin/employees/${enc(id)}/reset-password`, { newPassword, mustChangePassword }, R)
    .then((r) => r.data);
}

export function setEmployeeStatus(id, isActive) {
  return api.patch(`/admin/employees/${enc(id)}/status`, { isActive }, R).then((r) => r.data);
}

export function deleteEmployee(id) {
  return api.delete(`/admin/employees/${enc(id)}`, R).then((r) => r.data);
}

/* ------------------------------ customers ------------------------------- */

export function listCustomers(query = {}) {
  return api.get('/admin/customers', { ...R, params: params(query) }).then((r) => r.data);
}

export function getCustomer(id) {
  return api.get(`/admin/customers/${enc(id)}`, R).then((r) => r.data);
}

export function createCustomer(payload) {
  return api.post('/admin/customers', payload, R).then((r) => r.data);
}

export function updateCustomer(id, payload) {
  return api.patch(`/admin/customers/${enc(id)}`, payload, R).then((r) => r.data);
}

export function resetCustomerPassword(id, newPassword, mustChangePassword = true) {
  return api
    .post(`/admin/customers/${enc(id)}/reset-password`, { newPassword, mustChangePassword }, R)
    .then((r) => r.data);
}

export function setCustomerStatus(id, isActive) {
  return api.patch(`/admin/customers/${enc(id)}/status`, { isActive }, R).then((r) => r.data);
}

export function deleteCustomer(id) {
  return api.delete(`/admin/customers/${enc(id)}`, R).then((r) => r.data);
}

/* ------------------------------ projects -------------------------------- */

export function listProjects(query = {}) {
  return api.get('/admin/projects', { ...R, params: params(query) }).then((r) => r.data);
}

export function getProject(id) {
  return api.get(`/admin/projects/${enc(id)}`, R).then((r) => r.data);
}

export function createProject(payload) {
  return api.post('/admin/projects', payload, R).then((r) => r.data);
}

export function updateProject(id, payload) {
  return api.patch(`/admin/projects/${enc(id)}`, payload, R).then((r) => r.data);
}

export function assignProject(id, payload) {
  return api.patch(`/admin/projects/${enc(id)}/assign`, payload, R).then((r) => r.data);
}

export function publishProject(id, isPublished) {
  return api.patch(`/admin/projects/${enc(id)}/publish`, { isPublished }, R).then((r) => r.data);
}

export function featureProject(id, isFeatured) {
  return api.patch(`/admin/projects/${enc(id)}/feature`, { isFeatured }, R).then((r) => r.data);
}

export function orderProject(id, order) {
  return api.patch(`/admin/projects/${enc(id)}/order`, { order }, R).then((r) => r.data);
}

export function progressProject(id, progress) {
  return api.patch(`/admin/projects/${enc(id)}/progress`, { progress }, R).then((r) => r.data);
}

export function deleteProject(id) {
  return api.delete(`/admin/projects/${enc(id)}`, R).then((r) => r.data);
}

/* -------------------------------- tasks --------------------------------- */

export function listTasks(query = {}) {
  return api.get('/admin/tasks', { ...R, params: params(query) }).then((r) => r.data);
}

export function getTask(id) {
  return api.get(`/admin/tasks/${enc(id)}`, R).then((r) => r.data);
}

export function createTask(payload) {
  return api.post('/admin/tasks', payload, R).then((r) => r.data);
}

export function updateTask(id, payload) {
  return api.patch(`/admin/tasks/${enc(id)}`, payload, R).then((r) => r.data);
}

export function setTaskStatus(id, status) {
  return api.patch(`/admin/tasks/${enc(id)}/status`, { status }, R).then((r) => r.data);
}

export function addTaskComment(id, text) {
  return api.post(`/admin/tasks/${enc(id)}/comments`, { text }, R).then((r) => r.data);
}

export function deleteTask(id) {
  return api.delete(`/admin/tasks/${enc(id)}`, R).then((r) => r.data);
}

/* ----------------------------- inquiries -------------------------------- */

export function listInquiries(query = {}) {
  return api.get('/admin/inquiries', { ...R, params: params(query) }).then((r) => r.data);
}

export function getInquiry(id) {
  return api.get(`/admin/inquiries/${enc(id)}`, R).then((r) => r.data);
}

export function setInquiryStatus(id, status) {
  return api.patch(`/admin/inquiries/${enc(id)}/status`, { status }, R).then((r) => r.data);
}

export function setInquiryNotes(id, notes) {
  return api.patch(`/admin/inquiries/${enc(id)}/notes`, { notes }, R).then((r) => r.data);
}

export function deleteInquiry(id) {
  return api.delete(`/admin/inquiries/${enc(id)}`, R).then((r) => r.data);
}

/* ------------------------------- tickets -------------------------------- */

export function listTickets(query = {}) {
  return api.get('/admin/tickets', { ...R, params: params(query) }).then((r) => r.data);
}

export function getTicket(id) {
  return api.get(`/admin/tickets/${enc(id)}`, R).then((r) => r.data);
}

export function replyTicket(id, body) {
  return api.post(`/admin/tickets/${enc(id)}/replies`, { body }, R).then((r) => r.data);
}

export function setTicketStatus(id, status) {
  return api.patch(`/admin/tickets/${enc(id)}/status`, { status }, R).then((r) => r.data);
}

export function setTicketPriority(id, priority) {
  return api.patch(`/admin/tickets/${enc(id)}/priority`, { priority }, R).then((r) => r.data);
}

/* ---------------------------- leave requests ---------------------------- */

export function listLeaves(query = {}) {
  return api.get('/admin/leave-requests', { ...R, params: params(query) }).then((r) => r.data);
}

export function approveLeave(id, reviewNote = '') {
  return api.patch(`/admin/leave-requests/${enc(id)}/approve`, { reviewNote }, R).then((r) => r.data);
}

export function rejectLeave(id, reviewNote = '') {
  return api.patch(`/admin/leave-requests/${enc(id)}/reject`, { reviewNote }, R).then((r) => r.data);
}

/* --------------------------- announcements ------------------------------ */

export function listAnnouncements(query = {}) {
  return api.get('/admin/announcements', { ...R, params: params(query) }).then((r) => r.data);
}

export function getAnnouncement(id) {
  return api.get(`/admin/announcements/${enc(id)}`, R).then((r) => r.data);
}

export function createAnnouncement(payload) {
  return api.post('/admin/announcements', payload, R).then((r) => r.data);
}

export function updateAnnouncement(id, payload) {
  return api.patch(`/admin/announcements/${enc(id)}`, payload, R).then((r) => r.data);
}

export function deleteAnnouncement(id) {
  return api.delete(`/admin/announcements/${enc(id)}`, R).then((r) => r.data);
}

/* ------------------------------- invoices ------------------------------- */

export function listInvoices(query = {}) {
  return api.get('/admin/invoices', { ...R, params: params(query) }).then((r) => r.data);
}

export function getInvoice(id) {
  return api.get(`/admin/invoices/${enc(id)}`, R).then((r) => r.data);
}

export function createInvoice(payload) {
  return api.post('/admin/invoices', payload, R).then((r) => r.data);
}

export function updateInvoice(id, payload) {
  return api.patch(`/admin/invoices/${enc(id)}`, payload, R).then((r) => r.data);
}

export function setInvoiceStatus(id, status) {
  return api.patch(`/admin/invoices/${enc(id)}/status`, { status }, R).then((r) => r.data);
}

export function deleteInvoice(id) {
  return api.delete(`/admin/invoices/${enc(id)}`, R).then((r) => r.data);
}
