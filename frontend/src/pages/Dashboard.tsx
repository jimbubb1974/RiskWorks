import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Dashboard</h1>
      {user ? (
        <div className="rounded border border-gray-200 bg-white p-4">
          <p className="text-gray-700">Signed in as {user.email}</p>
          <button
            onClick={logout}
            className="mt-3 inline-flex items-center rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Sign out
          </button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
