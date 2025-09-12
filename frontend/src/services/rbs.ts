import { apiClient } from "./api";

export type RBSNode = {
  id: number;
  name: string;
  description?: string | null;
  order_index: number;
  parent_id?: number | null;
};

export type RBSNodeCreate = Omit<RBSNode, "id">;
export type RBSNodeUpdate = Partial<Omit<RBSNode, "id">>;

export async function listRBS(): Promise<RBSNode[]> {
  const { data } = await apiClient.get<RBSNode[]>("/rbs");
  return data;
}

export async function listRBSTree(): Promise<RBSNode[]> {
  const { data } = await apiClient.get<RBSNode[]>("/rbs/tree");
  return data;
}

export async function createRBSNode(payload: RBSNodeCreate): Promise<RBSNode> {
  const { data } = await apiClient.post<RBSNode>("/rbs", payload);
  return data;
}

export async function updateRBSNode(
  id: number,
  payload: RBSNodeUpdate
): Promise<RBSNode> {
  const { data } = await apiClient.put<RBSNode>(`/rbs/${id}`, payload);
  return data;
}

export async function deleteRBSNode(id: number): Promise<void> {
  await apiClient.delete(`/rbs/${id}`);
}
