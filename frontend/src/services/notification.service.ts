import { api } from "../api/axios";

export interface NotificationMeta {
  channelId?: string;
  channelName?: string;
  dmId?: string;
  messageId?: string;
  senderId?: string;
  senderName?: string;
  preview?: string;
  [key: string]: string | undefined;
}

export interface Notification {
  _id: string;
  user: string;
  type: string;
  message: string;
  meta: NotificationMeta;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const notificationService = {
  async list(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>("/notifications");
    return data;
  },

  async markRead(id: string): Promise<{ read: boolean }> {
    const { data } = await api.patch<{ read: boolean }>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  async markAllRead(): Promise<{ readAll: boolean }> {
    const { data } = await api.patch<{ readAll: boolean }>(
      "/notifications/read-all",
    );
    return data;
  },
};

export default notificationService;
