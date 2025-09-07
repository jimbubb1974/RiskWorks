export interface ActionItem {
  id: number;
  title: string;
  description?: string;
  action_type: "mitigation" | "contingency" | "monitoring";
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assigned_to?: number;
  created_by: number;
  risk_id: number;
  due_date?: string;
  completed_date?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ActionItemCreate {
  title: string;
  description?: string;
  action_type: "mitigation" | "contingency" | "monitoring";
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assigned_to?: number;
  risk_id: number;
  due_date?: string | null;
  progress_percentage: number;
}

export interface ActionItemUpdate {
  title?: string;
  description?: string;
  action_type?: "mitigation" | "contingency" | "monitoring";
  priority?: "low" | "medium" | "high" | "critical";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  assigned_to?: number;
  due_date?: string;
  progress_percentage?: number;
}
