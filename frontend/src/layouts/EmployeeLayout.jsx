import PortalShell from '../components/layout/PortalShell.jsx';
import { useEmployeeAuth } from '../context/EmployeeAuth.jsx';
import { useThemeContext } from '../context/ThemeContext.jsx';

const NAV_ITEMS = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: 'IconBolt' },
  { to: '/employee/projects', label: 'Projects', icon: 'IconBriefcase' },
  { to: '/employee/tasks', label: 'Tasks', icon: 'IconCode' },
  { to: '/employee/leaves', label: 'Leave', icon: 'IconMail' },
  { to: '/employee/announcements', label: 'News', icon: 'IconGlobe' },
  { to: '/employee/profile', label: 'Profile', icon: 'IconUser' },
];

export default function EmployeeLayout() {
  const { user, logout } = useEmployeeAuth();
  const { theme, toggle } = useThemeContext();

  return (
    <PortalShell
      portalName="Employee Portal"
      navItems={NAV_ITEMS}
      user={user}
      onLogout={logout}
      theme={theme}
      onToggleTheme={toggle}
    />
  );
}
