export type ChatMessageEvent = {
  type: 'message';
  conversationId: string;
  data: {
    id: string;
    conversationId: string;
    senderUserId: string;
    role: string;
    body: string;
    attachments?: unknown;
    createdAt: string;
  };
};

export type ChatReadEvent = {
  type: 'read';
  conversationId: string;
  data: {
    byUserId: string;
    readUpToId?: string;
    updated: number;
  };
};

export type ChatEvent = ChatMessageEvent | ChatReadEvent;

export const ChatChannel = {
  message: (conversationId: string) => `chat:conv:${conversationId}:message`,
  read: (conversationId: string) => `chat:conv:${conversationId}:read`,
  pattern: 'chat:conv:*:*',
} as const;
