export type Risk = {
  id: number;
  risk_name: string;
  risk_description?: string | null;

  // Risk Assessment (1-5 scale)
  probability: number;
  impact: number;

  // Risk details
  scope: RiskScope;
  risk_owner?: string;
  rbs_node_id?: number | null;
  latest_reviewed_date?: string;
  probability_basis?: string;
  impact_basis?: string;
  // notes?: string;  // Temporarily commented out

  // Status and ownership
  status: RiskStatus;
  owner_id: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Computed fields
  score: number;
  risk_level: string;
  action_items_count: number;
};

export type RiskCreate = {
  risk_name: string;
  risk_description?: string | null;
  probability: number;
  impact: number;
  scope?: RiskScope;
  risk_owner?: string;
  rbs_node_id?: number | null;
  latest_reviewed_date?: string;
  probability_basis?: string;
  impact_basis?: string;
  notes?: string;
  status?: RiskStatus;
};

export type RiskUpdate = Partial<RiskCreate>;

export type RiskStatus =
  | "open"
  | "closed"
  | "draft"
  | "in_progress"
  | "mitigated"
  | "escalated";
export type RiskScope = "project" | "site" | "enterprise";
