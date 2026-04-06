import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  AtSign,
  MessageSquare,
  Hash,
  Info,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import notificationService, {
  type Notification,
} from "../services/notification.service";

/* ─── helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fullTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/* ─── categories ─── */

type Category = "dm" | "mention" | "other";

const CATEGORIES: { key: Category; label: string; icon: typeof Bell }[] = [
  { key: "dm", label: "Direct Messages", icon: MessageSquare },
  { key: "mention", label: "Mentions", icon: AtSign },
  { key: "other", label: "Other", icon: Info },
];

function categorize(type: string): Category {
  if (type === "dm_message") return "dm";
  if (type === "mention") return "mention";
  return "other";
}

/* ─── component ─── */

interface NotificationsProps {
  onBack: () => void;
}

type Filter = "all" | "unread" | "dm" | "mention";

export default function Notifications({ onBack }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  /* derived counts */
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const dmCount = notifications.filter((n) => n.type === "dm_message").length;
  const mentionCount = notifications.filter((n) => n.type === "mention").length;

  /* filtered list */
  const displayed = useMemo(() => {
    let list = notifications;
    if (filter === "unread") list = list.filter((n) => !n.readAt);
    else if (filter === "dm") list = list.filter((n) => n.type === "dm_message");
    else if (filter === "mention") list = list.filter((n) => n.type === "mention");
    return list;
  }, [notifications, filter]);

  /* group by category for "all" view */
  const grouped = useMemo(() => {
    const map: Record<Category, Notification[]> = { dm: [], mention: [], other: [] };
    displayed.forEach((n) => map[categorize(n.type)].push(n));
    return map;
  }, [displayed]);

  /* actions */
  const markRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    } catch {
      toast.error("Couldn't mark as read");
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Couldn't mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  /* filter config */
  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "dm", label: "DMs", count: dmCount },
    { key: "mention", label: "Mentions", count: mentionCount },
  ];

  /* ─── notification card ─── */
  const renderCard = (n: Notification) => {
    const isUnread = !n.readAt;
    const isDM = n.type === "dm_message";
    const isMention = n.type === "mention";

    return (
      <div
        key={n._id}
        onClick={() => isUnread && markRead(n._id)}
        className={`group flex items-start gap-3.5 px-5 sm:px-6 py-4 transition-all cursor-pointer border-b last:border-b-0 ${
          isUnread
            ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100/60 dark:border-slate-700/80 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40"
            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        }`}
      >
        {/* Sender avatar */}
        {n.meta?.senderName ? (
          <div
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs ${
              isDM
                ? "bg-linear-to-br from-emerald-400 to-teal-500"
                : isMention
                  ? "bg-linear-to-br from-indigo-400 to-purple-500"
                  : "bg-linear-to-br from-slate-400 to-slate-500"
            }`}
          >
            {getInitials(n.meta.senderName)}
          </div>
        ) : (
          <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Top row: sender + badge + time */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-sm font-semibold truncate ${
                  isUnread
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {n.meta?.senderName || "System"}
              </span>

              {isDM && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                  <MessageSquare className="w-2.5 h-2.5" />
                  DM
                </span>
              )}
              {isMention && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                  <AtSign className="w-2.5 h-2.5" />
                  Mention
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isUnread && (
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
              <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {timeAgo(n.createdAt)}
              </span>
            </div>
          </div>

          {/* Channel context */}
          {n.meta?.channelName && (
            <div className="flex items-center gap-1 mb-1">
              <Hash className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {n.meta.channelName}
              </span>
            </div>
          )}

          {/* Description */}
          <p
            className={`text-sm leading-relaxed ${
              isUnread
                ? "text-slate-700 dark:text-slate-200"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {n.message}
          </p>

          {/* Message preview quote */}
          {n.meta?.preview && (
            <div className="mt-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border-l-2 border-slate-300 dark:border-slate-600">
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                &ldquo;{n.meta.preview}&rdquo;
              </p>
            </div>
          )}

          {/* Full timestamp on hover */}
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {fullTime(n.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  /* ─── category section ─── */
  const renderCategorySection = (cat: Category, items: Notification[]) => {
    if (items.length === 0) return null;
    const cfg = CATEGORIES.find((c) => c.key === cat)!;
    const Icon = cfg.icon;
    const unread = items.filter((n) => !n.readAt).length;

    return (
      <div key={cat} className="mb-2">
        {/* Section header */}
        <div className="sticky top-31.25 z-5 flex items-center gap-2.5 px-5 sm:px-6 py-2.5 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {cfg.label}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {items.length}
          </span>
          {unread > 0 && (
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              {unread} new
            </span>
          )}
        </div>

        {items.map(renderCard)}
      </div>
    );
  };

  /* ─── main render ─── */
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                Notifications
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {notifications.length} total &middot; {unreadCount} unread
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="px-5 sm:px-8 flex gap-1 -mb-px overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                filter === f.key
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    filter === f.key
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-75">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-100 text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
              <BellOff className="w-9 h-9 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {filter === "unread"
                ? "You're all caught up!"
                : filter === "dm"
                  ? "No direct messages"
                  : filter === "mention"
                    ? "No mentions yet"
                    : "No notifications yet"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {filter === "unread"
                ? "Great job — no unread notifications right now."
                : filter === "dm"
                  ? "When someone sends you a direct message, it'll show up here."
                  : filter === "mention"
                    ? "When you're @mentioned in a channel, it'll show up here."
                    : "Mentions, DMs, and other activity will appear here."}
            </p>
          </div>
        ) : filter === "all" ? (
          /* Categorized view for "All" tab */
          <div>
            {CATEGORIES.map((cat) =>
              renderCategorySection(cat.key, grouped[cat.key]),
            )}
          </div>
        ) : (
          /* Flat list for filtered tabs */
          <div>{displayed.map(renderCard)}</div>
        )}
      </div>
    </div>
  );
}
