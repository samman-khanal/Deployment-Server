import { useRef, useEffect, useState, useCallback } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  Download,
  ArrowDown,
  MessageSquare,
  Copy,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import messageService from "../../services/message.service";
import { getInitials } from "../workspace/WorkspaceContext";

import type { Message } from "../../services/message.service";
import type { WorkspaceMember } from "../../services/workspaceMember.service";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function isSameGroup(prev: Message, curr: Message): boolean {
  if (!prev.sender || !curr.sender) return false;
  if (prev.sender._id !== curr.sender._id) return false;
  if (prev.deletedAt || curr.deletedAt) return false;
  const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

/** Renders message content with @mentions highlighted */
function renderContent(
  content: string,
  mentions: Array<{ _id: string; fullName: string }> | undefined,
) {
  if (!mentions || mentions.length === 0) return <>{content}</>;

  // Build a split pattern from all mention names
  type Part = string | { type: "mention"; name: string; id: string };
  let parts: Part[] = [content];

  for (const mention of mentions) {
    const tag = `@${mention.fullName}`;
    const next: Part[] = [];
    for (const part of parts) {
      if (typeof part !== "string") { next.push(part); continue; }
      const segments = part.split(tag);
      segments.forEach((seg, i) => {
        if (seg) next.push(seg);
        if (i < segments.length - 1)
          next.push({ type: "mention", name: mention.fullName, id: mention._id });
      });
    }
    parts = next;
  }

  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <span
            key={i}
            className="text-indigo-400 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-0.5 rounded"
          >
            @{part.name}
          </span>
        ),
      )}
    </>
  );
}

interface ChatMessagesProps {
  messages: Message[];
  members: WorkspaceMember[];
  loading: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onMessagesChange: (updater: (prev: Message[]) => Message[]) => void;
}

export default function ChatMessages({
  messages,
  members,
  loading,
  emptyTitle = "Start the conversation",
  emptySubtitle = "Send the first message.",
  onMessagesChange,
}: ChatMessagesProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track how many messages existed on initial load to mark new ones
  const initialCountRef = useRef<number | null>(null);
  const [reactionMenuId, setReactionMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);

  // Close context menu on outside click or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Capture initial message count once (to detect newly arriving messages)
  useEffect(() => {
    if (loading) {
      initialCountRef.current = null;
      return;
    }
    if (messages.length > 0 && initialCountRef.current === null) {
      initialCountRef.current = messages.length;
    }
  }, [loading, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJumpToBottom(distFromBottom > 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleEditMessage = async (messageId: string) => {
    const content = editInput.trim();
    if (!content) return;
    try {
      const updated = await messageService.edit(messageId, content);
      onMessagesChange((prev) =>
        prev.map((m) => (m._id === messageId ? updated : m)),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to edit message");
    } finally {
      setEditingMessageId(null);
      setEditInput("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageService.remove(messageId);
      onMessagesChange((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, deletedAt: new Date().toISOString(), content: "" }
            : m,
        ),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete message");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const updated = await messageService.react(messageId, emoji);
      onMessagesChange((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, reactions: updated.reactions } : m,
        ),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to react");
    } finally {
      setReactionMenuId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex items-start gap-3 ${i % 3 === 2 ? "flex-row-reverse" : ""}`}>
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse shrink-0" />
            <div className="space-y-2 max-w-xs">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" />
              <div className={`h-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl animate-pulse ${i % 2 === 0 ? "w-64" : "w-44"}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {emptyTitle}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {emptySubtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-1 relative">
      {messages.map((m, msgIdx) => {
        const prevMsg = msgIdx > 0 ? messages[msgIdx - 1] : null;
        const grouped = prevMsg ? isSameGroup(prevMsg, m) : false;

        // Date separator
        const showDateSep = !prevMsg || new Date(m.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

        const senderName = m.sender?.fullName || "Unknown";
        const avatar = getInitials(senderName);
        const isMine = m.sender?._id === user?.id;
        const time = m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        // Group reactions by emoji
        const reactionCounts: Record<
          string,
          { count: number; userReacted: boolean; names: string[] }
        > = {};
        (m.reactions || []).forEach((r) => {
          if (!reactionCounts[r.emoji])
            reactionCounts[r.emoji] = {
              count: 0,
              userReacted: false,
              names: [],
            };
          reactionCounts[r.emoji].count++;
          if (r.user === user?.id) {
            reactionCounts[r.emoji].userReacted = true;
            reactionCounts[r.emoji].names.push("You");
          } else {
            const member = members.find((mem) => mem.user?._id === r.user);
            reactionCounts[r.emoji].names.push(
              member?.user?.fullName || "Someone",
            );
          }
        });

        return (
          <div key={m._id}>
            {/* Unread divider — appears before first new message */}
            {initialCountRef.current !== null &&
              msgIdx === initialCountRef.current &&
              messages.length > initialCountRef.current && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-red-300 dark:bg-red-500/50" />
                <span className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-2 shrink-0">
                  New Messages
                </span>
                <div className="flex-1 h-px bg-red-300 dark:bg-red-500/50" />
              </div>
            )}
            {showDateSep && (
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 px-2">
                  {formatDateSeparator(m.createdAt)}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
              </div>
            )}
          <div
            className={`flex gap-3 group relative ${!grouped ? "mt-3" : ""} ${isMine ? "flex-row-reverse" : ""}`}
          >
            {m.deletedAt ? (
              <>
                {!grouped ? (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 opacity-40 ${
                    isMine
                      ? "bg-linear-to-br from-indigo-600 to-violet-600"
                      : "bg-linear-to-br from-indigo-500 to-purple-600"
                  }`}
                >
                  {avatar}
                </div>
                ) : <div className="w-9 shrink-0" />}
                <div className={`max-w-[70%] min-w-0 ${isMine ? "text-right" : ""}`}>
                  {!grouped && (
                  <div className={`flex items-baseline gap-2 mb-1 ${isMine ? "justify-end" : ""}`}>
                    {isMine ? (
                      <>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{time}</span>
                        <span className="font-semibold text-slate-400 dark:text-slate-500 text-sm">{senderName}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-400 dark:text-slate-500 text-sm">{senderName}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{time}</span>
                      </>
                    )}
                  </div>
                  )}
                  <div
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm border border-dashed ${
                      isMine
                        ? "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-br-md"
                        : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-bl-md"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    This message was deleted
                  </div>
                </div>
              </>
            ) : (
              <>
                {!grouped ? (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                    isMine
                      ? "bg-linear-to-br from-indigo-600 to-violet-600"
                      : "bg-linear-to-br from-indigo-500 to-purple-600"
                  }`}
                >
                  {avatar}
                </div>
                ) : <div className="w-9 shrink-0" />}
                <div className={`max-w-[70%] min-w-0 ${isMine ? "text-right" : ""}`}>
                  {!grouped && (
                  <div className={`flex items-baseline gap-2 mb-1 ${isMine ? "justify-end" : ""}`}>
                    {isMine ? (
                      <>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{time}</span>
                        {m.editedAt && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">(edited)</span>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{senderName}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{senderName}</span>
                        {m.editedAt && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">(edited)</span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500">{time}</span>
                      </>
                    )}
                  </div>
                  )}
                  <div className="relative inline-block">
                    {editingMessageId === m._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditMessage(m._id);
                            if (e.key === "Escape") {
                              setEditingMessageId(null);
                              setEditInput("");
                            }
                          }}
                          autoFocus
                          className="px-3 py-2 rounded-xl text-sm border border-indigo-300 dark:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-50"
                        />
                        <button
                          onClick={() => handleEditMessage(m._id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditInput("");
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ msgId: m._id, x: e.clientX, y: e.clientY });
                          }}
                          className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed cursor-default ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md"
                          }`}
                        >
                          {renderContent(m.content, m.mentions)}
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {m.attachments.map((att, idx) => {
                                const isImage = att.mimeType?.startsWith("image/");
                                if (isImage) {
                                  return (
                                    <img
                                      key={idx}
                                      src={`data:${att.mimeType};base64,${att.dataBase64}`}
                                      alt={att.fileName}
                                      className="max-w-full max-h-60 rounded-lg cursor-pointer"
                                      onClick={() =>
                                        window.open(
                                          `data:${att.mimeType};base64,${att.dataBase64}`,
                                          "_blank",
                                        )
                                      }
                                    />
                                  );
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={`data:${att.mimeType};base64,${att.dataBase64}`}
                                    download={att.fileName}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                      isMine
                                        ? "border-indigo-400/40 bg-indigo-500/30 hover:bg-indigo-500/40 text-white"
                                        : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <span className="truncate text-xs font-medium">{att.fileName}</span>
                                    <span className="text-[10px] opacity-60 shrink-0">
                                      ({(att.size / 1024).toFixed(1)} KB)
                                    </span>
                                    <Download className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Three-dot menu */}
                        <button
                          onClick={() =>
                            setReactionMenuId(reactionMenuId === m._id ? null : m._id)
                          }
                          className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all ${
                            reactionMenuId === m._id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          } ${isMine ? "-left-9" : "-right-9"}`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Popup menu */}
                        {reactionMenuId === m._id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setReactionMenuId(null)}
                            />
                            <div
                              className={`absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 animate-in fade-in zoom-in-95 duration-150 ${
                                isMine
                                  ? msgIdx === 0
                                    ? "right-0 top-full mt-2"
                                    : "right-0 bottom-full mb-2"
                                  : msgIdx === 0
                                    ? "left-0 top-full mt-2"
                                    : "left-0 bottom-full mb-2"
                              }`}
                            >
                              <div className="flex gap-1">
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(m._id, emoji)}
                                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all hover:scale-110"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              {isMine && (
                                <div className="border-t border-slate-200 dark:border-slate-600 mt-1.5 pt-1.5 flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(m._id);
                                      setEditInput(m.content);
                                      setReactionMenuId(null);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-1"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteMessage(m._id);
                                      setReactionMenuId(null);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Existing reactions */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {Object.entries(reactionCounts).map(
                        ([emoji, { count, userReacted, names }]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(m._id, emoji)}
                            title={`${names.join(", ")} reacted with ${emoji}`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              userReacted
                                ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-medium">{count}</span>
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
      {showJumpToBottom && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-10"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Right-click context menu */}
      {contextMenu && (() => {
        const cm = messages.find((m) => m._id === contextMenu.msgId);
        if (!cm) return null;
        const isCmMine = cm.sender?._id === user?.id;
        return (
          <div
            style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1 min-w-40 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={() => {
                navigator.clipboard.writeText(cm.content);
                toast.success("Copied to clipboard");
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy text
            </button>
            <button
              onClick={() => {
                setReactionMenuId(contextMenu.msgId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
              React
            </button>
            {isCmMine && !cm.deletedAt && (
              <>
                <div className="my-1 border-t border-slate-200 dark:border-slate-600" />
                <button
                  onClick={() => {
                    setEditingMessageId(cm._id);
                    setEditInput(cm.content);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDeleteMessage(cm._id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
