import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Hash, Lock, Menu, Settings } from "lucide-react";
import { toast } from "sonner";

import { useWorkspace } from "../workspace/WorkspaceContext";
import { useAuth } from "../../hooks/useAuth";
import { getSocket, EVENTS } from "../../services/socket.service";
import messageService from "../../services/message.service";
import ChatMessages from "../chat/ChatMessages";
import ChatInput from "../chat/ChatInput";
import ChannelSettingsModal from "./ChannelSettingsModal";

import type { Message } from "../../services/message.service";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuth();
  const {
    channels,
    members,
    myWorkspaceRole,
    setUnreadChannelCounts,
  } = useWorkspace();
  const { setIsSidebarOpen } = useOutletContext<{
    isSidebarOpen: boolean;
    setIsSidebarOpen: (v: boolean) => void;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const selectedChannel = useMemo(
    () => channels.find((c) => c._id === channelId) || null,
    [channels, channelId],
  );

  useDocumentTitle(selectedChannel ? `#${selectedChannel.name}` : "Channel");

  const canManageChannel =
    myWorkspaceRole === "owner" || myWorkspaceRole === "admin";

  // Load messages
  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;

    (async () => {
      try {
        setMessagesLoading(true);
        const msgs = await messageService.listByChannel(channelId);
        if (!cancelled) setMessages(msgs.reverse());
      } catch (err: any) {
        if (!cancelled)
          toast.error(
            err?.response?.data?.message || "Failed to load messages",
          );
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  // Clear unread on mount
  useEffect(() => {
    if (!channelId) return;
    setUnreadChannelCounts((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
  }, [channelId, setUnreadChannelCounts]);

  // Socket: real-time messages
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();

    const onNew = (msg: Message) => {
      const msgChannelId = String((msg as any).channel || "");
      if (msgChannelId !== channelId) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Clear unread since we're viewing this channel
      setUnreadChannelCounts((prev) => {
        if (!prev[channelId]) return prev;
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
    };
    const onEdited = (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };
    const onDeleted = ({ _id }: { _id: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === _id
            ? { ...m, deletedAt: new Date().toISOString(), content: "" }
            : m,
        ),
      );
    };
    const onReacted = (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    socket.on(EVENTS.CHANNEL_MESSAGE_NEW, onNew);
    socket.on(EVENTS.CHANNEL_MESSAGE_EDITED, onEdited);
    socket.on(EVENTS.CHANNEL_MESSAGE_DELETED, onDeleted);
    socket.on(EVENTS.CHANNEL_MESSAGE_REACTED, onReacted);

    const onUserTyping = ({ userName }: { channelId: string; userName: string }) => {
      setTypingUsers((prev) => prev.includes(userName) ? prev : [...prev, userName]);
    };
    const onUserStoppedTyping = ({ userName }: { channelId: string; userName: string }) => {
      setTypingUsers((prev) => prev.filter((n) => n !== userName));
    };

    socket.on(EVENTS.CHANNEL_USER_TYPING, onUserTyping);
    socket.on(EVENTS.CHANNEL_USER_STOPPED_TYPING, onUserStoppedTyping);

    return () => {
      socket.off(EVENTS.CHANNEL_MESSAGE_NEW, onNew);
      socket.off(EVENTS.CHANNEL_MESSAGE_EDITED, onEdited);
      socket.off(EVENTS.CHANNEL_MESSAGE_DELETED, onDeleted);
      socket.off(EVENTS.CHANNEL_MESSAGE_REACTED, onReacted);
      socket.off(EVENTS.CHANNEL_USER_TYPING, onUserTyping);
      socket.off(EVENTS.CHANNEL_USER_STOPPED_TYPING, onUserStoppedTyping);
    };
  }, [channelId, setUnreadChannelCounts]);

  const handleSend = async (content: string, file?: File, mentionIds?: string[]) => {
    if (!channelId) return;
    try {
      const sent = await messageService.sendToChannel(
        channelId,
        content,
        file,
        mentionIds,
      );
      setMessages((prev) => {
        if (prev.some((m) => m._id === sent._id)) return prev;
        return [...prev, sent];
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to send message",
      );
    }
  };

  const handleTyping = () => {
    if (!channelId) return;
    getSocket().emit(EVENTS.CHANNEL_TYPING_START, { channelId });
  };

  const handleStopTyping = () => {
    if (!channelId) return;
    getSocket().emit(EVENTS.CHANNEL_TYPING_STOP, { channelId });
  };

  const typingText = typingUsers.length === 0
    ? null
    : typingUsers.length === 1
      ? `${typingUsers[0]} is typing…`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing…`
        : "Several people are typing…";

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
        Channel not found
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-linear-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
              {selectedChannel.type === "private" ? (
                <Lock className="w-5 h-5 text-indigo-600" />
              ) : (
                <Hash className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {selectedChannel.name}
                {selectedChannel.type === "private" && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                    Private
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {(selectedChannel as any).description
                  ? (selectedChannel as any).description
                  : `${members.length} member${members.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(selectedChannel.type === "private"
              ? canManageChannel
              : true) && (
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                title="Channel settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ChatMessages
        messages={messages}
        members={members}
        loading={messagesLoading}
        emptyTitle="Start the conversation"
        emptySubtitle={`Send the first message in #${selectedChannel.name}.`}
        onMessagesChange={setMessages}
      />

      {/* Typing indicator */}
      {typingText && (
        <div className="px-6 py-1 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            {typingText}
          </p>
        </div>
      )}

      {/* Input */}
      <ChatInput
        placeholder={`Message #${selectedChannel.name}`}
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        members={members
          .filter((m) => m.user?._id !== user?.id)
          .map((m) => ({ id: m.user._id, name: m.user.fullName }))}
      />

      {/* Channel Settings Modal */}
      {showSettings && selectedChannel && (
        <ChannelSettingsModal
          channel={selectedChannel}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
