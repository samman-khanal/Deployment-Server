import { api } from "../api/axios";

export interface DMThread {
  _id: string;
  workspaceId: string;
  participants?: string[];
  otherUser?: {
    _id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    online?: boolean;
  };
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const dmService = {
  async list(workspaceId: string): Promise<DMThread[]> {
    const { data } = await api.get<DMThread[]>(`/workspaces/${workspaceId}/dms`);
    return data;
  },

  async openOrCreate(workspaceId: string, otherUserId: string): Promise<DMThread> {
    const { data } = await api.post<DMThread>(`/workspaces/${workspaceId}/dms`, { otherUserId });
    return data;
  },
};

export default dmService;