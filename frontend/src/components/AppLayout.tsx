import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, ListChecks, Settings, LogOut } from "lucide-react";

export default function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-4 flex flex-col">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-indigo-600" />
          <Link
            to="/dashboard"
            className="text-xl font-semibold tracking-tight"
          >
            RiskWorks
          </Link>
        </div>
        {user && (
          <div className="mb-4 text-xs text-gray-500">
            Signed in as {user.email}
          </div>
        )}
        <nav className="flex-1 space-y-1">
          <NavItem
            to="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={18} />}
          />
          <NavItem to="/risks" label="Risks" icon={<ListChecks size={18} />} />
          <NavItem
            to="/settings"
            label="Settings"
            icon={<Settings size={18} />}
          />
        </nav>
        <button
          onClick={handleLogout}
          className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded px-3 py-2 text-sm transition ${
          isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
