// import { api } from "../api/axios";

// export interface Channel {
//   _id: string;
//   workspaceId: string;
//   name: string;
//   isPrivate: boolean;
//   isDefault?: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface CreateChannelInput {
//   name: string;
//   isPrivate?: boolean;
// }

// const channelService = {
//   async list(workspaceId: string): Promise<Channel[]> {
//     const { data } = await api.get<Channel[]>(`/workspaces/${workspaceId}/channels`);
//     return data;
//   },

//   async create(workspaceId: string, input: CreateChannelInput): Promise<Channel> {
//     const payload = {
//       name: input.name.trim().toLowerCase().replace(/\s+/g, "-"),
//       isPrivate: !!input.isPrivate,
//     };

//     const { data } = await api.post<Channel>(`/workspaces/${workspaceId}/channels`, payload);
//     return data;
//   },
// };

// export default channelService;

import { api } from "../api/axios";

export type ChannelType = "public" | "private";

export interface Channel {
  _id: string;
  workspaceId: string;
  name: string;
  type: ChannelType;
  createdBy?: string;
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChannelInput {
  name: string;
  type: ChannelType;
}

const channelService = {
  async list(workspaceId: string): Promise<Channel[]> {
    const { data } = await api.get<Channel[]>(
      `/workspaces/${workspaceId}/channels`,
    );
    return data;
  },

  async create(workspaceId: string, input: CreateChannelInput): Promise<Channel> {
    const payload = {
      name: input.name.trim().toLowerCase().replace(/\s+/g, "-"),
      type: input.type,
    };

    const { data } = await api.post<Channel>(
      `/workspaces/${workspaceId}/channels`,
      payload,
    );
    return data;
  },

  async addMembers(channelId: string, userIds: string[]): Promise<Channel> {
    const { data } = await api.post<Channel>(
      `/channels/${channelId}/members`,
      { userIds },
    );
    return data;
  },

  async update(channelId: string, patch: { name?: string }): Promise<Channel> {
    const { data } = await api.patch<Channel>(`/channels/${channelId}`, patch);
    return data;
  },

  async removeMember(channelId: string, memberId: string): Promise<Channel> {
    const { data } = await api.delete<Channel>(
      `/channels/${channelId}/members/${memberId}`,
    );
    return data;
  },

  async remove(channelId: string): Promise<Channel> {
    const { data } = await api.delete<Channel>(`/channels/${channelId}`);
    return data;
  },
};

export default channelService;