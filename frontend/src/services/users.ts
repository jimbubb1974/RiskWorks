import { apiClient } from "./api";

export interface User {
  id: number;
  email: string;
  created_at: string;
  role?: string;
  status?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export const usersService = {
  // Get all users with optional filtering
  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append("search", params.search);
    if (params?.role) searchParams.append("role", params.role);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const response = await apiClient.get(`/users?${searchParams.toString()}`);
    return response.data;
  },

  // Get a specific user by ID
  async getUser(id: number): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Create a new user (for future use)
  async createUser(userData: {
    email: string;
    password: string;
  }): Promise<User> {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },
};
