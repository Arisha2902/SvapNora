import AdminShell from '../components/layout/AdminShell.jsx';
import { useAdminAuth } from '../context/AdminAuth.jsx';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { useReveal } from '../hooks/useReveal.js';

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const { theme, toggle } = useThemeContext();
  useReveal();

  return <AdminShell user={user} onLogout={logout} theme={theme} onToggleTheme={toggle} />;
}
