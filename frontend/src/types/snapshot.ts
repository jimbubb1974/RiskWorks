export interface Snapshot {
  id: number;
  name: string;
  description?: string;
  risk_data: {
    risks: any[];
    snapshot_created_at: string;
    total_risks: number;
  };
  action_items_data?: {
    action_items: any[];
    snapshot_created_at: string;
    total_action_items: number;
  };
  created_at: string;
  created_by: number;
  risk_count: number;
  action_items_count: number;
}

export interface SnapshotCreate {
  name: string;
  description?: string;
}

export interface SnapshotUpdate {
  name?: string;
  description?: string;
}

export interface SnapshotRestore {
  snapshot_id: number;
  confirm: boolean;
}
