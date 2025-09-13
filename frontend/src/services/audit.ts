import { api } from "./api";

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  user_id: number;
  action: string;
  changes?: Record<string, any>;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  user_email?: string;
}

export interface RiskTrendDataPoint {
  timestamp: string;
  user_id: number;
  probability?: number;
  impact?: number;
  score?: number;
  risk_level?: string;
}

export interface AuditLogFilter {
  entity_type?: string;
  entity_id?: number;
  user_id?: number;
  action?: string;
  limit?: number;
  offset?: number;
}

export const auditService = {
  // Get audit logs with optional filtering
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLog[]> {
    const params = new URLSearchParams();

    if (filter.entity_type) params.append("entity_type", filter.entity_type);
    if (filter.entity_id)
      params.append("entity_id", filter.entity_id.toString());
    if (filter.user_id) params.append("user_id", filter.user_id.toString());
    if (filter.action) params.append("action", filter.action);
    if (filter.limit) params.append("limit", filter.limit.toString());
    if (filter.offset) params.append("offset", filter.offset.toString());

    const response = await api.get(`/audit/logs?${params.toString()}`);
    return response.data;
  },

  // Get audit trail for a specific risk
  async getRiskAuditTrail(
    riskId: number,
    limit: number = 50
  ): Promise<AuditLog[]> {
    const response = await api.get(
      `/audit/risks/${riskId}/trail?limit=${limit}`
    );
    return response.data;
  },

  // Get audit trail for a specific action item
  async getActionItemAuditTrail(
    actionItemId: number,
    limit: number = 50
  ): Promise<AuditLog[]> {
    const response = await api.get(
      `/audit/action-items/${actionItemId}/trail?limit=${limit}`
    );
    return response.data;
  },

  // Get risk trend data
  async getRiskTrend(
    riskId: number,
    days: number = 30
  ): Promise<RiskTrendDataPoint[]> {
    const response = await api.get(`/audit/risks/${riskId}/trend?days=${days}`);
    return response.data;
  },
};
