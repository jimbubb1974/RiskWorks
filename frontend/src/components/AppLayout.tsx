import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import {
  LayoutDashboard,
  ListChecks,
  Network,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Users,
  FileText,
  History,
} from "lucide-react";
import { useState } from "react";

export default function AppLayout() {
  const { logout, user } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-accent-50 lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 glass border-r border-white/20 p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-10
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 lg:hidden"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <Link
            to="/app/dashboard"
            className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
          >
            RiskWorks
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="mb-6 p-3 rounded-xl bg-white/30 border border-white/20">
            <div className="text-sm font-medium text-secondary-900 truncate">
              {user.email}
            </div>
            <div className="text-xs text-secondary-600">Administrator</div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavItem
            to="/app/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={20} />}
            description="Overview & Analytics"
          />
          {permissions.canViewRisks() && (
            <NavItem
              to="/app/risks"
              label="Risks"
              icon={<ListChecks size={20} />}
              description="Manage & Assess"
            />
          )}
          {permissions.canViewUsers() && (
            <NavItem
              to="/app/users"
              label="Users"
              icon={<Users size={20} />}
              description="Manage Users"
            />
          )}
          {permissions.canViewReports() && (
            <NavItem
              to="/app/reports"
              label="Reports"
              icon={<FileText size={20} />}
              description="Generate & Export"
            />
          )}
          <NavItem
            to="/app/rbs"
            label="RBS"
            icon={<Network size={20} />}
            description="Risk Breakdown Structure"
          />
          {permissions.canViewAuditLogs() && (
            <NavItem
              to="/app/audit"
              label="Audit Logs"
              icon={<History size={20} />}
              description="Track Changes"
            />
          )}
          {permissions.canViewSettings() && (
            <NavItem
              to="/app/settings"
              label="Settings"
              icon={<Settings size={20} />}
              description="Preferences"
            />
          )}
        </nav>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 w-full p-3 rounded-xl text-sm text-secondary-600 hover:text-secondary-900 hover:bg-white/20 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top bar */}
        <header className="glass border-b border-white/20 p-4 lg:p-6 relative z-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-white/20 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  {pageTitle}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  description,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-700 shadow-md"
            : "hover:bg-white/20 text-secondary-700 hover:text-secondary-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`transition-colors ${
              isActive
                ? "text-primary-600"
                : "text-secondary-500 group-hover:text-secondary-700"
            }`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{label}</div>
            {description && (
              <div className="text-xs text-secondary-500 truncate">
                {description}
              </div>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/app/dashboard")) return "Dashboard";
  if (pathname.startsWith("/app/risks/new")) return "Create Risk";
  if (pathname.startsWith("/app/risks") && pathname.includes("/edit"))
    return "Edit Risk";
  if (pathname.startsWith("/app/risks") && pathname !== "/app/risks")
    return "Risk Details";
  if (pathname.startsWith("/app/risks")) return "Risk Management";
  if (pathname.startsWith("/app/users") && pathname !== "/app/users")
    return "User Details";
  if (pathname.startsWith("/app/users")) return "User Management";
  if (pathname.startsWith("/app/reports")) return "Reports";
  if (pathname.startsWith("/app/audit")) return "Audit Logs";
  if (pathname.startsWith("/app/settings")) return "Settings";
  if (pathname.startsWith("/app/rbs")) return "Risk Breakdown Structure";
  return "RiskWorks";
}
