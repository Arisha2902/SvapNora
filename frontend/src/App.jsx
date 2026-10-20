import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import AppRoutes from './routes/index.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import {
  AdminAuthProvider,
  EmployeeAuthProvider,
  ThemeProvider,
} from './context/index.js';

/**
 * App shell.
 *
 * Provider order matters:
 *  - BrowserRouter first, because the auth contexts redirect on 401/403.
 *  - Separate auth providers, so each portal has its own session state.
 */
export default function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <ThemeProvider>
          <AdminAuthProvider>
            <EmployeeAuthProvider>
              <ToastProvider>
                <ScrollToTop />
                <AppRoutes />
              </ToastProvider>
            </EmployeeAuthProvider>
          </AdminAuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}
