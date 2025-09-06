export type Risk = {
  id: number;
  title: string;
  description?: string | null;

  // Risk Assessment
  likelihood: number;
  impact: number;

  // Enhanced fields
  category?: string;
  risk_owner?: string;
  department?: string;
  location?: string;

  // Risk details
  root_cause?: string;
  mitigation_strategy?: string;
  contingency_plan?: string;

  // Dates
  target_date?: string;
  review_date?: string;

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
  title: string;
  description?: string | null;
  likelihood: number;
  impact: number;
  category?: RiskCategory;
  risk_owner?: string;
  department?: string;
  location?: string;
  root_cause?: string;
  mitigation_strategy?: string;
  contingency_plan?: string;
  target_date?: string;
  review_date?: string;
  status?: RiskStatus;
  assigned_to?: number;
};

export type RiskUpdate = Partial<RiskCreate>;

export type RiskStatus =
  | "open"
  | "in_progress"
  | "mitigated"
  | "closed"
  | "escalated";
export type RiskCategory =
  | "operational"
  | "financial"
  | "strategic"
  | "technical"
  | "compliance"
  | "security"
  | "environmental"
  | "reputational";
