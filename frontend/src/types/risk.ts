export type Risk = {
  id: number;
  risk_name: string;
  risk_description?: string | null;

  // Risk Assessment (1-5 scale)
  probability: number;
  impact: number;

  // Risk details
  category?: string;
  risk_owner?: string;
  latest_reviewed_date?: string;
  probability_basis?: string;
  impact_basis?: string;
  // notes?: string;  // Temporarily commented out

  // Status and ownership
  status: RiskStatus;
  owner_id: number;
  assigned_to?: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Computed fields
  score: number;
  risk_level: string;
};

export type RiskCreate = {
  risk_name: string;
  risk_description?: string | null;
  probability: number;
  impact: number;
  category?: RiskCategory;
  risk_owner?: string;
  latest_reviewed_date?: string;
  probability_basis?: string;
  impact_basis?: string;
  notes?: string;
  status?: RiskStatus;
  assigned_to?: number;
};

export type RiskUpdate = Partial<RiskCreate>;

export type RiskStatus = "open" | "closed" | "draft";
export type RiskCategory =
  | "operational"
  | "financial"
  | "strategic"
  | "technical"
  | "compliance"
  | "security"
  | "environmental"
  | "reputational";
