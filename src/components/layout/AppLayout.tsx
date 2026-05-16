import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Key,
  Webhook,
  BarChart2,
  ClipboardList,
  LogOut,
  Shield,
  Users,
  AlertTriangle,
  Mail,
  Inbox,
  FlaskConical,
  Brain,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const tenantNav: NavItem[] = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/analyses', label: 'Analyses', icon: <Activity className="h-4 w-4" /> },
  { href: '/test', label: 'Test Upload', icon: <FlaskConical className="h-4 w-4" /> },
  { href: '/api-keys', label: 'API Keys', icon: <Key className="h-4 w-4" /> },
  { href: '/webhook', label: 'Webhook', icon: <Webhook className="h-4 w-4" /> },
  { href: '/usage', label: 'Usage', icon: <BarChart2 className="h-4 w-4" /> },
  { href: '/audit-logs', label: 'Audit Logs', icon: <ClipboardList className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { href: '/admin/tenants', label: 'Tenants', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/apps', label: 'Apps', icon: <Shield className="h-4 w-4" /> },
  { href: '/admin/analyses', label: 'Sessions', icon: <Activity className="h-4 w-4" /> },
  { href: '/admin/exercise-configs', label: 'Exercise Configs', icon: <Brain className="h-4 w-4" /> },
  { href: '/admin/usage', label: 'Usage', icon: <BarChart2 className="h-4 w-4" /> },
  { href: '/admin/failed-jobs', label: 'Failed Jobs', icon: <AlertTriangle className="h-4 w-4" /> },
  { href: '/admin/webhook-events', label: 'Webhooks', icon: <Mail className="h-4 w-4" /> },
  { href: '/admin/dlq', label: 'DLQ', icon: <Inbox className="h-4 w-4" /> },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: <ClipboardList className="h-4 w-4" /> },
];

function NavLink({ href, label, icon }: NavItem) {
  const location = useLocation();
  const isActive = location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'owner' && user?.tenantId === 'platform';
  const location = useLocation();
  const inAdminSection = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-card flex flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <span className="font-bold text-lg tracking-tight text-primary">Fuze</span>
          <span className="ml-1 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">Form</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {inAdminSection ? (
            <>
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admin</p>
              {adminNav.map((item) => <NavLink key={item.href} {...item} />)}
              <div className="pt-4 border-t mt-4">
                <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                  Tenant Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {user?.tenantName ?? 'Dashboard'}
              </p>
              {tenantNav.map((item) => <NavLink key={item.href} {...item} />)}
              {isAdmin && (
                <div className="pt-4 border-t mt-4">
                  <Link to="/admin/tenants" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
