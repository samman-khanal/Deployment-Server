import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Menu, Phone, Video } from "lucide-react";
import { toast } from "sonner";

import { useWorkspace, getInitials } from "../workspace/WorkspaceContext";
import { useAuth } from "../../hooks/useAuth";
import type { WebRTCCallHandle } from "../../hooks/useWebRTCCall";
import { getSocket, EVENTS } from "../../services/socket.service";
import messageService from "../../services/message.service";
import ChatMessages from "../chat/ChatMessages";
import ChatInput from "../chat/ChatInput";

import type { Message } from "../../services/message.service";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function DMPage() {
  const { dmId } = useParams<{ dmId: string }>();
  const { user } = useAuth();
  const {
    dms,
    members,
    setUnreadDMCounts,
    onlineUsers,
  } = useWorkspace();
  const { setIsSidebarOpen, call } = useOutletContext<{
    isSidebarOpen: boolean;
    setIsSidebarOpen: (v: boolean) => void;
    call: WebRTCCallHandle;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const selectedDM = useMemo(
    () => dms.find((d) => d._id === dmId) || null,
    [dms, dmId],
  );

  useDocumentTitle(selectedDM?.otherUser?.name ? `DM · ${selectedDM.otherUser.name}` : "Direct Message");

  const isSelfDM = useMemo(() => {
    if (!selectedDM?.participants || !user?.id) return false;
    return (
      (selectedDM.participants.length === 1 &&
        selectedDM.participants[0] === user.id) ||
      (selectedDM.participants.length === 2 &&
        selectedDM.participants.every((p: string) => p === user.id)) ||
      selectedDM.otherUser?._id === user.id
    );
  }, [selectedDM, user]);

  const peerUserId = useMemo(() => {
    if (!selectedDM || !user?.id || isSelfDM) return null;
    return (
      selectedDM.otherUser?._id ||
      selectedDM.participants?.find((p: string) => p !== user.id) ||
      null
    );
  }, [isSelfDM, selectedDM, user?.id]);

  const peerName = useMemo(() => {
    if (isSelfDM) {
      const myMember = members.find((m) => m.user?._id === user?.id);
      return myMember?.user?.fullName || "You";
    }
    let name = selectedDM?.otherUser?.name || "";
    if (!name && selectedDM?.participants) {
      const otherId = selectedDM.participants.find(
        (p: string) => p !== user?.id,
      );
      const otherMember = members.find((m) => m.user?._id === otherId);
      name = otherMember?.user?.fullName || "";
    }
    return name || "User";
  }, [isSelfDM, selectedDM, members, user]);

  // Load messages
  useEffect(() => {
    if (!dmId) return;
    let cancelled = false;

    (async () => {
      try {
        setMessagesLoading(true);
        const msgs = await messageService.listByDM(dmId);
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
  }, [dmId]);

  // Clear unread on mount
  useEffect(() => {
    if (!dmId) return;
    setUnreadDMCounts((prev) => {
      if (!prev[dmId]) return prev;
      const next = { ...prev };
      delete next[dmId];
      return next;
    });
  }, [dmId, setUnreadDMCounts]);

  // Socket: real-time messages
  useEffect(() => {
    if (!dmId) return;
    const socket = getSocket();

    const onNew = (msg: Message) => {
      const msgDmId = String((msg as any).dm || "");
      if (msgDmId !== dmId) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setUnreadDMCounts((prev) => {
        if (!prev[dmId]) return prev;
        const next = { ...prev };
        delete next[dmId];
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

    socket.on(EVENTS.DM_MESSAGE_NEW, onNew);
    socket.on(EVENTS.DM_MESSAGE_EDITED, onEdited);
    socket.on(EVENTS.DM_MESSAGE_DELETED, onDeleted);
    socket.on(EVENTS.DM_MESSAGE_REACTED, onReacted);

    const onUserTyping = ({ userName }: { dmId: string; userName: string }) => {
      setTypingUsers((prev) => prev.includes(userName) ? prev : [...prev, userName]);
    };
    const onUserStoppedTyping = ({ userName }: { dmId: string; userName: string }) => {
      setTypingUsers((prev) => prev.filter((n) => n !== userName));
    };

    socket.on(EVENTS.DM_USER_TYPING, onUserTyping);
    socket.on(EVENTS.DM_USER_STOPPED_TYPING, onUserStoppedTyping);

    return () => {
      socket.off(EVENTS.DM_MESSAGE_NEW, onNew);
      socket.off(EVENTS.DM_MESSAGE_EDITED, onEdited);
      socket.off(EVENTS.DM_MESSAGE_DELETED, onDeleted);
      socket.off(EVENTS.DM_MESSAGE_REACTED, onReacted);
      socket.off(EVENTS.DM_USER_TYPING, onUserTyping);
      socket.off(EVENTS.DM_USER_STOPPED_TYPING, onUserStoppedTyping);
    };
  }, [dmId, setUnreadDMCounts]);

  const handleSend = async (content: string, file?: File, mentionIds?: string[]) => {
    if (!dmId) return;
    try {
      const sent = await messageService.sendToDM(dmId, content, file, mentionIds);
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
    if (!dmId) return;
    getSocket().emit(EVENTS.DM_TYPING_START, { dmId });
  };

  const handleStopTyping = () => {
    if (!dmId) return;
    getSocket().emit(EVENTS.DM_TYPING_STOP, { dmId });
  };

  const typingText = typingUsers.length === 0
    ? null
    : typingUsers.length === 1
      ? `${typingUsers[0]} is typing…`
      : "Several people are typing…";

  if (!selectedDM) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
        Conversation not found
      </div>
    );
  }

  const initials = getInitials(peerName);

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

            {isSelfDM ? (
              <>
                <div className="relative">
                  <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-100 dark:bg-amber-900/60 rounded-full flex items-center justify-center">
                    <span className="text-[8px]">📝</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {peerName}{" "}
                    <span className="text-base font-medium text-slate-400">
                      (you)
                    </span>
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Draft messages &amp; notes
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  {peerUserId && onlineUsers.has(peerUserId) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {peerName}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {peerUserId && onlineUsers.has(peerUserId) ? "Active now" : "Offline"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Call buttons */}
          {!isSelfDM && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!selectedDM?._id || !peerUserId) return;
                  call.startCall({
                    dmId: selectedDM._id,
                    peerUserId,
                    type: "audio",
                  });
                }}
                disabled={!selectedDM?._id || !peerUserId}
                className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={!peerUserId ? "Audio call unavailable" : "Start audio call"}
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!selectedDM?._id || !peerUserId) return;
                  call.startCall({
                    dmId: selectedDM._id,
                    peerUserId,
                    type: "video",
                  });
                }}
                disabled={!selectedDM?._id || !peerUserId}
                className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={!peerUserId ? "Video call unavailable" : "Start video call"}
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ChatMessages
        messages={messages}
        members={members}
        loading={messagesLoading}
        emptyTitle="Start the conversation"
        emptySubtitle={
          isSelfDM
            ? "Jot something down in your notes."
            : `Send the first message to ${peerName}.`
        }
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
        placeholder={
          isSelfDM
            ? "Jot something down..."
            : `Message ${peerName}`
        }
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        members={(() => {
          const peer = members.find((m) => m.user?._id === peerUserId);
          return peer ? [{ id: peer.user._id, name: peer.user.fullName }] : [];
        })()}
      />
    </div>
  );
}
