import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loginRequest,
  meRequest,
  registerRequest,
  type UserResponse,
} from "../services/api";

type AuthContextValue = {
  user: UserResponse | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    meRequest()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      async login(email, password) {
        const res = await loginRequest(email, password);
        localStorage.setItem("token", res.access_token);
        setToken(res.access_token);
        const u = await meRequest();
        setUser(u);
      },
      async register(email, password) {
        await registerRequest(email, password);
        await this.login(email, password);
      },
      logout() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      },
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
