import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // Redirect to dashboard if accessing the root of protected routes
  if (location.pathname === "/app") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
