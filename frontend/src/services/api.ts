import axios from "axios";

// Production API URL - hardcoded for deployment
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://riskworks.onrender.com"
    : "http://localhost:8000");

// Debug logging
console.log("API Configuration:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  API_BASE_URL: API_BASE_URL,
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
): Promise<{ id: number; email: string }> {
  const { data } = await apiClient.post<{ id: number; email: string }>(
    "/auth/register",
    {
      email,
      password,
    }
  );
  return data;
}

export async function meRequest(): Promise<{ id: number; email: string }> {
  const { data } = await apiClient.get<{ id: number; email: string }>(
    "/auth/me"
  );
  return data;
}

// Action Items API
import type {
  ActionItem,
  ActionItemCreate,
  ActionItemUpdate,
} from "../types/actionItem";
import type {
  Snapshot,
  SnapshotCreate,
  SnapshotUpdate,
  SnapshotRestore,
} from "../types/snapshot";

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

// Snapshots API
export async function createSnapshot(
  snapshot: SnapshotCreate
): Promise<Snapshot> {
  const { data } = await apiClient.post<Snapshot>("/snapshots/", snapshot);
  return data;
}

export async function getSnapshots(): Promise<Snapshot[]> {
  const { data } = await apiClient.get<Snapshot[]>("/snapshots/");
  return data;
}

export async function getSnapshot(id: number): Promise<Snapshot> {
  const { data } = await apiClient.get<Snapshot>(`/snapshots/${id}`);
  return data;
}

export async function updateSnapshot(
  id: number,
  snapshot: SnapshotUpdate
): Promise<Snapshot> {
  const { data } = await apiClient.put<Snapshot>(`/snapshots/${id}`, snapshot);
  return data;
}

export async function deleteSnapshot(id: number): Promise<void> {
  await apiClient.delete(`/snapshots/${id}`);
}

export async function restoreSnapshot(
  id: number,
  confirm: boolean = true
): Promise<{
  success: boolean;
  message: string;
  restored_risks?: number;
  restored_action_items?: number;
}> {
  const { data } = await apiClient.post(`/snapshots/${id}/restore`, {
    snapshot_id: id,
    confirm,
  });
  return data;
}

export async function exportSnapshot(id: number): Promise<Blob> {
  const response = await apiClient.get(`/snapshots/${id}/export`, {
    responseType: "blob",
  });
  return response.data;
}

export async function importSnapshot(file: File): Promise<{
  success: boolean;
  message: string;
  snapshot_id?: number;
  imported_risks?: number;
  imported_action_items?: number;
}> {
  console.log(
    "Importing file:",
    file.name,
    "type:",
    file.type,
    "size:",
    file.size
  );

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post("/snapshots/import", formData);
  return data;
}
