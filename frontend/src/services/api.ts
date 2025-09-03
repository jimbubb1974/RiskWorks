import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Export apiClient as api for backward compatibility
export const api = apiClient;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type LoginResponse = { access_token: string; token_type: string };
export type UserResponse = { id: number; email: string };

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const { data } = await apiClient.post<LoginResponse>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function registerRequest(
  email: string,
  password: string
): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>("/auth/register", {
    email,
    password,
  });
  return data;
}

export async function meRequest(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return data;
}
