import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import EmployeeLayout from '../layouts/EmployeeLayout.jsx';
import PortalNotFound from '../components/PortalNotFound.jsx';
import StaticRedirect from '../components/StaticRedirect.jsx';
import RouteFallback from '../components/layout/RouteFallback.jsx';
import { RequireAdmin, RequireAdminGuest, RequireEmployee, RequireEmployeeGuest } from './guards.jsx';

/* Route-level code splitting: the public site, each portal and the admin panel
   only download the chunk they actually need. */
const Home = lazy(() => import('../pages/public/Home.jsx'));
const ContactPage = lazy(() => import('../pages/public/ContactPage.jsx'));
const Privacy = lazy(() => import('../pages/public/Privacy.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'));
const AdminLogin = lazy(() => import('../pages/admin/Login.jsx'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const AdminDirectory = lazy(() => import('../pages/admin/Directory.jsx'));
const AdminRecordDetail = lazy(() => import('../pages/admin/RecordDetail.jsx'));
const AdminProjects = lazy(() => import('../pages/admin/Projects.jsx'));
const AdminProjectDetail = lazy(() => import('../pages/admin/ProjectDetail.jsx'));
const AdminTasks = lazy(() => import('../pages/admin/Tasks.jsx'));
const AdminTaskDetail = lazy(() => import('../pages/admin/TaskDetail.jsx'));
const AdminInquiries = lazy(() => import('../pages/admin/Inquiries.jsx'));
const AdminInquiryDetail = lazy(() => import('../pages/admin/InquiryDetail.jsx'));
const AdminTickets = lazy(() => import('../pages/admin/Tickets.jsx'));
const AdminTicketDetail = lazy(() => import('../pages/admin/TicketDetail.jsx'));
const AdminLeaves = lazy(() => import('../pages/admin/Leaves.jsx'));
const AdminAnnouncements = lazy(() => import('../pages/admin/Announcements.jsx'));
const AdminAnnouncementDetail = lazy(() => import('../pages/admin/AnnouncementDetail.jsx'));
const AdminInvoices = lazy(() => import('../pages/admin/Invoices.jsx'));
const AdminInvoiceDetail = lazy(() => import('../pages/admin/InvoiceDetail.jsx'));
const AdminAudit = lazy(() => import('../pages/admin/AuditLog.jsx'));
const AdminProfile = lazy(() => import('../pages/admin/Profile.jsx'));
const AdminSettings = lazy(() => import('../pages/admin/Settings.jsx'));
const EmployeeLogin = lazy(() => import('../pages/employee/Login.jsx'));
const EmployeeDashboard = lazy(() => import('../pages/employee/Dashboard.jsx'));
const EmployeeProjects = lazy(() => import('../pages/employee/Projects.jsx'));
const EmployeeProjectDetail = lazy(() => import('../pages/employee/ProjectDetail.jsx'));
const EmployeeTasks = lazy(() => import('../pages/employee/Tasks.jsx'));
const EmployeeTaskDetail = lazy(() => import('../pages/employee/TaskDetail.jsx'));
const EmployeeLeaves = lazy(() => import('../pages/employee/Leaves.jsx'));
const EmployeeAnnouncements = lazy(() => import('../pages/employee/Announcements.jsx'));
const EmployeeAnnouncementDetail = lazy(() => import('../pages/employee/AnnouncementDetail.jsx'));
const EmployeeProfile = lazy(() => import('../pages/employee/Profile.jsx'));

/* Legacy static links (index.html, index.html#contact, ...) must land on the
   SPA home page instead of rendering the 404 for a literal /index.html path. */
function IndexHtmlRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/${search}${hash}`} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ---------------------------------------------------------------- */}
        {/* Public site                                                       */}
        {/* ---------------------------------------------------------------- */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="index.html" element={<IndexHtmlRedirect />} />

          {/* Pre-built static pages - these hand over to a real document load */}
          <Route path="services" element={<StaticRedirect to="/services.html" label="Services" />} />
          <Route path="products" element={<StaticRedirect to="/products.html" label="Products" />} />
          <Route path="glowlang" element={<StaticRedirect to="/glowlang.html" label="GlowLang" />} />
          <Route path="about" element={<StaticRedirect to="/about.html" label="About us" />} />
          <Route path="terms" element={<StaticRedirect to="/terms.html" label="Terms of Service" />} />

          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<Privacy />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Account recovery (public, but never indexed) */}
        <Route path="forgot-password" element={<ForgotPassword />} />

        {/* ---------------------------------------------------------------- */}
        {/* Admin panel - private, unlinked, noindex                          */}
        {/* ---------------------------------------------------------------- */}
        <Route
          path="admin/login"
          element={
            <RequireAdminGuest>
              <AdminLogin />
            </RequireAdminGuest>
          }
        />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="employees" element={<AdminDirectory kind="employee" />} />
          <Route path="employees/:id" element={<AdminRecordDetail kind="employee" />} />
          <Route path="customers" element={<AdminDirectory kind="customer" />} />
          <Route path="customers/:id" element={<AdminRecordDetail kind="customer" />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:id" element={<AdminProjectDetail />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="tasks/:id" element={<AdminTaskDetail />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="inquiries/:id" element={<AdminInquiryDetail />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="tickets/:id" element={<AdminTicketDetail />} />
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="announcements/:id" element={<AdminAnnouncementDetail />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="invoices/:id" element={<AdminInvoiceDetail />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<PortalNotFound portal="Admin" base="admin" />} />
        </Route>

        {/* ---------------------------------------------------------------- */}
        {/* Employee portal                                                   */}
        {/* ---------------------------------------------------------------- */}
        <Route
          path="employee/login"
          element={
            <RequireEmployeeGuest>
              <EmployeeLogin />
            </RequireEmployeeGuest>
          }
        />
        <Route
          path="employee"
          element={
            <RequireEmployee>
              <EmployeeLayout />
            </RequireEmployee>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="projects" element={<EmployeeProjects />} />
          <Route path="projects/:id" element={<EmployeeProjectDetail />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="tasks/:id" element={<EmployeeTaskDetail />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="announcements" element={<EmployeeAnnouncements />} />
          <Route path="announcements/:id" element={<EmployeeAnnouncementDetail />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="*" element={<PortalNotFound portal="Employee" base="employee" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
