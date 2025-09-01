export type Risk = {
  id: number;
  title: string;
  description?: string | null;
  severity: number;
  probability: number;
  status: "open" | "mitigated" | "closed";
  owner_id: number;
  created_at: string;
  updated_at: string;
};

export type RiskCreate = {
  title: string;
  description?: string | null;
  severity: number;
  probability: number;
  status?: "open" | "mitigated" | "closed";
};

export type RiskUpdate = Partial<RiskCreate>;
