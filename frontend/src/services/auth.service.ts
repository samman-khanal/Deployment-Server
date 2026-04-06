// src/services/auth.service.ts
import { api } from "../api/axios";

export type Role = "user" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(
    fullName: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const payload = { email: email.trim().toLowerCase() };
    const { data } = await api.post("/auth/forgot-password", payload);
    return data;
  },

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    const payload = { password, confirmPassword };
    const { data } = await api.post(`/auth/reset-password/${token}`, payload);
    return data;
  },

  // Optional: if your backend has this
  async logout(): Promise<{ message: string }> {
    const { data } = await api.post("/auth/logout");
    return data;
  },

  // Optional: get current user from token
  async me(): Promise<User> {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

export default authService;
