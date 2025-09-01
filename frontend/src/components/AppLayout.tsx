import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  LogOut,
  Shield,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AppLayout() {
  const { logout, user } = useAuth();
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
        lg:relative lg:translate-x-0 lg:z-auto
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
            to="/dashboard"
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
            to="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={20} />}
            description="Overview & Analytics"
          />
          <NavItem
            to="/risks"
            label="Risks"
            icon={<ListChecks size={20} />}
            description="Manage & Assess"
          />
          <NavItem
            to="/settings"
            label="Settings"
            icon={<Settings size={20} />}
            description="Preferences"
          />
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
        <header className="glass border-b border-white/20 p-4 lg:p-6">
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
                <p className="text-sm text-secondary-600">
                  {getCurrentTimeGreeting()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search button */}
              <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Search size={20} className="text-secondary-600" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Bell size={20} className="text-secondary-600" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
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
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/risks/new")) return "Create Risk";
  if (pathname.startsWith("/risks") && pathname.includes("/edit"))
    return "Edit Risk";
  if (pathname.startsWith("/risks") && pathname !== "/risks")
    return "Risk Details";
  if (pathname.startsWith("/risks")) return "Risk Management";
  if (pathname.startsWith("/settings")) return "Settings";
  return "RiskWorks";
}

function getCurrentTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! Ready to tackle today's challenges?";
  if (hour < 17) return "Good afternoon! How's your risk management going?";
  return "Good evening! Time to review today's progress.";
}
