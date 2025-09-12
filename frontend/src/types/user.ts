export interface User {
  id: number;
  email: string;
  hashed_password: string;
  plain_password?: string; // For development - shows actual password
  role: string;
  created_at: string;
}

export interface UserUpdate {
  email?: string;
  role?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface Role {
  value: string;
  label: string;
  description: string;
}

export type UserRole = "viewer" | "editor" | "manager";
