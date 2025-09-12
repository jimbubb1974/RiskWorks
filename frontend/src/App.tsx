import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RisksList from "./pages/RisksList";
import RiskForm from "./pages/RiskForm";
import RiskDetail from "./pages/RiskDetail";
import AppLayout from "./components/AppLayout";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Reports from "./pages/Reports";
import LandingPage from "./components/LandingPage";
import RBSPage from "./pages/RBS";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/risks", element: <RisksList /> },
          { path: "/risks/new", element: <RiskForm /> },
          { path: "/risks/:id", element: <RiskDetail /> },
          { path: "/risks/:id/edit", element: <RiskForm /> },
          { path: "/users", element: <Users /> },
          { path: "/users/:id", element: <UserDetail /> },
          { path: "/reports", element: <Reports /> },
          { path: "/rbs", element: <RBSPage /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  );
}
