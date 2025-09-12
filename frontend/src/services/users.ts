import { apiClient } from "./api";
import type { User, UserUpdate, Role } from "../types/user";

export const usersService = {
  // Get all users with optional filtering
  async getUsers(params?: {
    search?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append("search", params.search);
    if (params?.role) searchParams.append("role", params.role);
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

  // Create a new user (admin endpoint)
  async createUser(userData: {
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const response = await apiClient.post("/users", userData);
    return response.data;
  },

  // Update a user (admin endpoint)
  async updateUser(id: number, userData: UserUpdate): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  // Get available roles
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get("/users/roles");
    return response.data;
  },

  // Get user permissions based on role
  async getUserPermissions(userId: number): Promise<string[]> {
    const response = await apiClient.get(`/users/${userId}/permissions`);
    return response.data;
  },
};
