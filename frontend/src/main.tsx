import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
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

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div>
        Home - <a href="/login">Login</a>
      </div>
    ),
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/risks", element: <RisksList /> },
      { path: "/risks/new", element: <RiskForm /> },
      { path: "/risks/:id", element: <RiskDetail /> },
      { path: "/risks/:id/edit", element: <RiskForm /> },
    ],
  },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
);
