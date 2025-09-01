import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>Signed in as {user.email}</p>
          <button onClick={logout}>Sign out</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
