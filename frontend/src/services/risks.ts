import { apiClient } from "./api";
import type { Risk, RiskCreate, RiskUpdate } from "../types/risk";

export async function listRisks(params?: {
  status?: string;
  min_probability?: number;
  search?: string;
  risk_owner?: string;
  sort_by?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<Risk[]> {
  const { data } = await apiClient.get<Risk[]>("/risks", { params });
  return data;
}

export async function createRisk(payload: RiskCreate): Promise<Risk> {
  const { data } = await apiClient.post<Risk>("/risks", payload);
  return data;
}

export async function getRisk(id: number): Promise<Risk> {
  const { data } = await apiClient.get<Risk>(`/risks/${id}`);
  return data;
}

export async function updateRisk(
  id: number,
  payload: RiskUpdate
): Promise<Risk> {
  const { data } = await apiClient.put<Risk>(`/risks/${id}`, payload);
  return data;
}

export async function deleteRisk(id: number): Promise<void> {
  await apiClient.delete(`/risks/${id}`);
}

export async function getRiskOwners(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/risks/owners");
  return data;
}
