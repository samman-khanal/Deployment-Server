import { api } from "../api/axios";

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  passwordChangedAt?: string;
}

const userService = {
  /** Get current authenticated user's profile */
  async getMe(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>("/users/me");
    return data;
  },

  /** Upload a new avatar image to Cloudinary via the backend */
  async uploadAvatar(file: File): Promise<UserProfile> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.patch<UserProfile>("/users/me/avatar", form, {
      headers: { "Content-Type": undefined },
    });
    return data;
  },

  /** Update current user's profile (fullName, avatarUrl) */
  async updateMe(patch: { fullName?: string; avatarUrl?: string }): Promise<UserProfile> {
    const { data } = await api.patch<UserProfile>("/users/me", patch);
    return data;
  },

  /** Change current user's password */
  async changePassword(newPassword: string): Promise<{ changed: boolean }> {
    const { data } = await api.patch<{ changed: boolean }>("/users/me/password", {
      newPassword,
    });
    return data;
  },
};

export default userService;
