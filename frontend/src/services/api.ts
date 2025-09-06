import axios from "axios";

// Production API URL - hardcoded for deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? "https://riskworks.onrender.com" : "http://localhost:8000");

// Debug logging
console.log("API Configuration:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  API_BASE_URL: API_BASE_URL
});

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

// Action Items API
import type {
  ActionItem,
  ActionItemCreate,
  ActionItemUpdate,
} from "../types/actionItem";

export async function getActionItems(params?: {
  risk_id?: number;
  status?: string;
  assigned_to?: number;
}): Promise<ActionItem[]> {
  const { data } = await apiClient.get<ActionItem[]>("/action-items/", {
    params,
  });
  return data;
}

export async function getActionItem(id: number): Promise<ActionItem> {
  const { data } = await apiClient.get<ActionItem>(`/action-items/${id}`);
  return data;
}

export async function createActionItem(
  actionItem: ActionItemCreate
): Promise<ActionItem> {
  const { data } = await apiClient.post<ActionItem>(
    "/action-items/",
    actionItem
  );
  return data;
}

export async function updateActionItem(
  id: number,
  actionItem: ActionItemUpdate
): Promise<ActionItem> {
  const { data } = await apiClient.put<ActionItem>(
    `/action-items/${id}`,
    actionItem
  );
  return data;
}

export async function deleteActionItem(id: number): Promise<void> {
  await apiClient.delete(`/action-items/${id}`);
}

export async function updateActionItemStatus(
  id: number,
  status: string,
  progress_percentage?: number
): Promise<ActionItem> {
  const { data } = await apiClient.patch<ActionItem>(
    `/action-items/${id}/status`,
    {
      status,
      progress_percentage,
    }
  );
  return data;
}
