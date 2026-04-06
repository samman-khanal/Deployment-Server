// import { api } from "../api/axios";

// export type ConversationType = "channel" | "dm";

// export interface Message {
//   _id: string;
//   workspaceId: string;
//   type: ConversationType;
//   refId: string; // channelId or dmId
//   content: string;
//   sender: {
//     _id: string;
//     name: string;
//     avatarUrl?: string;
//   };
//   createdAt: string;
// }

// export interface ListMessagesParams {
//   workspaceId: string;
//   type: ConversationType;
//   refId: string;
// }

// export interface SendMessageInput {
//   workspaceId: string;
//   type: ConversationType;
//   refId: string;
//   content: string;
// }

// const messageService = {
//   async list(params: ListMessagesParams): Promise<Message[]> {
//     const { workspaceId, type, refId } = params;
//     const { data } = await api.get<Message[]>(
//       `/workspaces/${workspaceId}/messages`,
//       { params: { type, refId } }
//     );
//     return data;
//   },

//   async send(input: SendMessageInput): Promise<Message> {
//     const payload = {
//       type: input.type,
//       refId: input.refId,
//       content: input.content.trim(),
//     };

//     const { data } = await api.post<Message>(`/workspaces/${input.workspaceId}/messages`, payload);
//     return data;
//   },
// };

// export default messageService;

import { api } from "../api/axios";

export interface Reaction {
  emoji: string;
  user: string; // userId
}

export interface Attachment {
  fileName: string;
  mimeType: string;
  size: number;
  dataBase64: string;
}

export interface Message {
  _id: string;
  channel: string; // channelId
  content: string;
  sender: {
    _id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string;
  };
  reactions?: Reaction[];
  attachments?: Attachment[];
  mentions?: Array<{ _id: string; fullName: string }>;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const messageService = {
  async listByChannel(channelId: string): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/channels/${channelId}/messages`);
    return data;
  },

  // backend expects: form-data { content, file?, mentions? }
  async sendToChannel(channelId: string, content: string, file?: File, mentionIds?: string[]): Promise<Message> {
    const fd = new FormData();
    fd.append("content", content.trim());
    if (file) fd.append("file", file);
    if (mentionIds && mentionIds.length > 0) fd.append("mentions", JSON.stringify(mentionIds));

    const { data } = await api.post<Message>(
      `/channels/${channelId}/messages`,
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return data;
  },

  async listByDM(dmId: string): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/dms/${dmId}/messages`);
    return data;
  },

  async sendToDM(dmId: string, content: string, file?: File, mentionIds?: string[]): Promise<Message> {
    const fd = new FormData();
    fd.append("content", content.trim());
    if (file) fd.append("file", file);
    if (mentionIds && mentionIds.length > 0) fd.append("mentions", JSON.stringify(mentionIds));

    const { data } = await api.post<Message>(
      `/dms/${dmId}/messages`,
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return data;
  },

  async edit(messageId: string, content: string): Promise<Message> {
    const { data } = await api.patch<Message>(`/messages/${messageId}`, {
      content: content.trim(),
    });
    return data;
  },

  async remove(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },

  async react(messageId: string, emoji: string): Promise<Message> {
    const { data } = await api.post<Message>(`/messages/${messageId}/reactions`, { emoji });
    return data;
  },
};

export default messageService;