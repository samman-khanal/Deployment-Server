import { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Trash2,
  Calendar,
  Users,
  Flag,
  Check,
  ChevronDown,
  AlignLeft,
  MessageSquare,
  CheckSquare,
  Paperclip,
  Plus,
  Send,
  FileText,
  Download,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Eye,
  Edit3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import boardService from "../services/board.service";
import type {
  Task,
  Comment as TaskComment,
  Attachment,
} from "../services/board.service";
import type { WorkspaceMember } from "../services/workspaceMember.service";

/* ─── Priority config ─── */

const PRIORITIES: Task["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const priorityStyles: Record<
  Task["priority"],
  { label: string; dot: string; bg: string; text: string }
> = {
  LOW: {
    label: "Low",
    dot: "bg-slate-400",
    bg: "bg-slate-100 dark:bg-slate-700",
    text: "text-slate-600 dark:text-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    dot: "bg-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
  },
  HIGH: {
    label: "High",
    dot: "bg-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  URGENT: {
    label: "Urgent",
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
  },
};

/* ─── Tabs ─── */

type TabId = "details" | "comments" | "checklist" | "attachments";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "details", label: "Details", icon: <AlignLeft className="w-4 h-4" /> },
  {
    id: "comments",
    label: "Comments",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: "checklist",
    label: "Checklist",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  {
    id: "attachments",
    label: "Attachments",
    icon: <Paperclip className="w-4 h-4" />,
  },
];

/* ─── Helpers ─── */

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
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

/* ─── Props ─── */

interface TaskDetailModalProps {
  task: Task;
  members: WorkspaceMember[];
  memberNames: Record<string, string>;
  onUpdate: (
    id: string,
    updates: Partial<
      Pick<
        Task,
        | "title"
        | "description"
        | "assignees"
        | "dueDate"
        | "priority"
        | "completed"
        | "checklist"
      >
    >,
  ) => Promise<void>;
  onClose: () => void;
  onDelete: (id: string) => void;
}

/* ─── Component ─── */

export default function TaskDetailModal({
  task,
  members,
  memberNames,
  onUpdate,
  onClose,
  onDelete,
}: TaskDetailModalProps) {
  const { user } = useAuth();

  /* ── Tabs ── */
  const [activeTab, setActiveTab] = useState<TabId>("details");

  /* ── Details state ── */
  const [title, setTitle] = useState(task.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [description, setDescription] = useState(task.description || "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descPreview, setDescPreview] = useState(false);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [assignees, setAssignees] = useState<string[]>(task.assignees);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  /* ── Comments state ── */
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  /* ── Checklist state ── */
  const [checklist, setChecklist] = useState<
    { _id?: string; text: string; done: boolean }[]
  >(task.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState("");

  /* ── Attachments state ── */
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Saving state ── */
  const [saving, setSaving] = useState(false);

  /* ── Sync task prop ── */
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setAssignees(task.assignees);
    setChecklist(task.checklist || []);
  }, [task]);

  /* ── Load comments when tab opens ── */
  useEffect(() => {
    if (activeTab === "comments" && comments.length === 0) {
      loadComments();
    }
  }, [activeTab]);

  /* ── Load attachments when tab opens ── */
  useEffect(() => {
    if (activeTab === "attachments" && attachments.length === 0) {
      loadAttachments();
    }
  }, [activeTab]);

  /* Close assignee dropdown on outside click */
  useEffect(() => {
    if (!showAssigneeDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        assigneeRef.current &&
        !assigneeRef.current.contains(e.target as Node)
      )
        setShowAssigneeDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAssigneeDropdown]);

  const memberList = useMemo(
    () =>
      members
        .map((m) => {
          const u = m.user;
          if (u?._id) return { _id: u._id, name: u.fullName };
          return null;
        })
        .filter(Boolean) as { _id: string; name: string }[],
    [members],
  );

  /* ── API helpers ── */

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await boardService.listComments(task._id);
      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadAttachments = async () => {
    setAttachmentsLoading(true);
    try {
      const data = await boardService.listAttachments(task._id);
      setAttachments(data);
    } catch {
      toast.error("Failed to load attachments");
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setSendingComment(true);
    try {
      await boardService.addComment(task._id, text);
      // Reload to get populated author
      await loadComments();
      setCommentText("");
    } catch {
      toast.error("Failed to send comment");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await boardService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const att = await boardService.uploadAttachment(task._id, file);
      setAttachments((prev) => [att, ...prev]);
      toast.success("File uploaded");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      await boardService.deleteAttachment(attId);
      setAttachments((prev) => prev.filter((a) => a._id !== attId));
      toast.success("Attachment deleted");
    } catch {
      toast.error("Failed to delete attachment");
    }
  };

  /* ── Checklist helpers ── */

  const handleAddCheckItem = () => {
    const text = newCheckItem.trim();
    if (!text) return;
    setChecklist((prev) => [...prev, { text, done: false }]);
    setNewCheckItem("");
  };

  const handleToggleCheckItem = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item,
      ),
    );
  };

  const handleRemoveCheckItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const checklistProgress = useMemo(() => {
    if (checklist.length === 0) return 0;
    return Math.round(
      (checklist.filter((c) => c.done).length / checklist.length) * 100,
    );
  }, [checklist]);

  /* ── Description toolbar ── */

  const descEditorRef = useRef<HTMLDivElement>(null);
  const descEditorInitialized = useRef(false);

  const turndown = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
      bulletListMarker: "-",
    });
    service.use(gfm);
    // Keep line breaks readable
    service.keep(["br"]);
    return service;
  }, []);

  const sanitizeHtml = (html: string): string => {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");

      // Remove dangerous elements
      const forbidden = [
        "script",
        "style",
        "iframe",
        "object",
        "embed",
        "link",
        "meta",
      ];
      forbidden.forEach((tag) => doc.querySelectorAll(tag).forEach((n) => n.remove()));

      // Remove inline event handlers + javascript: URLs
      doc.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          const value = attr.value;
          if (name.startsWith("on")) el.removeAttribute(attr.name);
          if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) {
            el.removeAttribute(attr.name);
          }
        });
      });

      return doc.body.innerHTML;
    } catch {
      return "";
    }
  };

  const setEditorFromMarkdown = (md: string) => {
    const el = descEditorRef.current;
    if (!el) return;
    const rawHtml = marked.parse(md || "") as string;
    el.innerHTML = sanitizeHtml(rawHtml);
  };

  const readMarkdownFromEditor = (): string => {
    const el = descEditorRef.current;
    if (!el) return description;
    const html = sanitizeHtml(el.innerHTML);
    const md = turndown.turndown(html);
    return md.replace(/\n{3,}/g, "\n\n").trim();
  };

  const focusEditor = () => {
    const el = descEditorRef.current;
    if (!el) return;
    el.focus();
  };

  const applyEditorCommand = (command: string, value?: string) => {
    focusEditor();
    // execCommand is deprecated but still widely supported and is the lightest way
    // to satisfy “bold button makes selection bold” without adding a big editor.
    document.execCommand(command, false, value);
    setDescription(readMarkdownFromEditor());
  };

  const insertInlineCode = () => {
    focusEditor();
    const selection = window.getSelection();
    const text = selection?.toString() || "code";
    document.execCommand("insertHTML", false, `<code>${text}</code>`);
    setDescription(readMarkdownFromEditor());
  };

  const insertCodeBlock = () => {
    focusEditor();
    const selection = window.getSelection();
    const text = selection?.toString() || "";
    const safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    document.execCommand(
      "insertHTML",
      false,
      `<pre><code>${safe || "// code"}</code></pre>`,
    );
    setDescription(readMarkdownFromEditor());
  };

  const createLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    applyEditorCommand("createLink", url);
  };

  // Initialize the rich-text editor when entering edit mode
  useEffect(() => {
    if (editingDesc && !descPreview) {
      if (!descEditorInitialized.current) {
        setEditorFromMarkdown(description);
        descEditorInitialized.current = true;
      }
    } else {
      descEditorInitialized.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDesc, descPreview, task._id]);

  /* ── Save all ── */

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onUpdate(task._id, {
        title: title.trim() || task.title,
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
        assignees,
        checklist,
      });
      toast.success("Task updated");
    } catch {
      // parent handles
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignee = (uid: string) => {
    setAssignees((prev) =>
      prev.includes(uid) ? prev.filter((a) => a !== uid) : [...prev, uid],
    );
  };

  /* ── Markdown components for styled rendering ── */
  const markdownComponents = {
    strong: ({ children, ...props }: any) => (
      <strong
        className="font-bold text-slate-900 dark:text-white"
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    del: ({ children, ...props }: any) => (
      <del className="line-through" {...props}>
        {children}
      </del>
    ),
    h1: ({ children, ...props }: any) => (
      <h1 className="text-xl font-bold mb-2 mt-3 text-slate-900 dark:text-white" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-lg font-bold mb-2 mt-3 text-slate-900 dark:text-white" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-base font-bold mb-1 mt-2 text-slate-900 dark:text-white" {...props}>{children}</h3>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-2 space-y-0.5 text-slate-700 dark:text-slate-300" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-2 space-y-0.5 text-slate-700 dark:text-slate-300" {...props}>{children}</ol>
    ),
    a: ({ children, ...props }: any) => (
      <a className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
    ),
    code: ({ children, className, ...props }: any) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <pre className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-2 overflow-x-auto">
            <code className="text-xs text-slate-800 dark:text-slate-200 font-mono" {...props}>{children}</code>
          </pre>
        );
      }
      return (
        <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono text-pink-600 dark:text-pink-400" {...props}>{children}</code>
      );
    },
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-indigo-300 dark:border-indigo-600 pl-3 italic text-slate-600 dark:text-slate-400 mb-2" {...props}>{children}</blockquote>
    ),
    hr: (props: any) => <hr className="my-3 border-slate-200 dark:border-slate-700" {...props} />,
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto mb-2">
        <table className="min-w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-3 py-1.5 text-left font-semibold bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60" {...props}>{children}</td>
    ),
    img: (props: any) => (
      <img className="max-w-full rounded-lg my-2 cursor-pointer hover:opacity-90" onClick={() => window.open(props.src, "_blank")} {...props} />
    ),
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        >
          {/* ─── Header ─── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Completed checkbox */}
              <button
                onClick={() => onUpdate(task._id, { completed: !task.completed })}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  task.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400 hover:text-emerald-400"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>

              {/* Title */}
              {editingTitle ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTitle(false);
                    if (e.key === "Escape") {
                      setTitle(task.title);
                      setEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="flex-1 text-lg font-bold text-slate-900 dark:text-white bg-transparent outline-none border-b-2 border-indigo-500 pb-0.5"
                />
              ) : (
                <h2
                  className={`text-lg font-bold truncate flex-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                    task.completed
                      ? "line-through text-slate-400 dark:text-slate-500"
                      : "text-slate-900 dark:text-white"
                  }`}
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit title"
                >
                  {title}
                </h2>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => {
                  onDelete(task._id);
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="flex gap-1 px-6 pt-3 pb-0 shrink-0 border-b border-slate-200 dark:border-slate-700">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                }`}
              >
                {tab.icon}
                {tab.label}
                {/* Badge counts */}
                {tab.id === "comments" && comments.length > 0 && (
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
                {tab.id === "checklist" && checklist.length > 0 && (
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                    {checklist.filter((c) => c.done).length}/{checklist.length}
                  </span>
                )}
                {tab.id === "attachments" && attachments.length > 0 && (
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                    {attachments.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ─── Tab Content ─── */}
          <div className="flex-1 overflow-y-auto">
            {/* ═══ DETAILS TAB ═══ */}
            {activeTab === "details" && (
              <div className="p-6 space-y-5">
                {/* Priority & Due Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Flag className="w-4 h-4" />
                      Priority
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {PRIORITIES.map((p) => {
                        const s = priorityStyles[p];
                        return (
                          <button
                            key={p}
                            onClick={() => setPriority(p)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                              priority === p
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                                : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${s.dot}`}
                            />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Due date */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <Users className="w-4 h-4" />
                    Assignees
                  </label>

                  <div className="relative" ref={assigneeRef}>
                    <button
                      onClick={() =>
                        setShowAssigneeDropdown(!showAssigneeDropdown)
                      }
                      className="w-full flex items-center justify-between text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500"
                    >
                      <span className="text-slate-500 dark:text-slate-400">
                        {assignees.length === 0
                          ? "Select members..."
                          : `${assignees.length} member${assignees.length > 1 ? "s" : ""} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {showAssigneeDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 max-h-48 overflow-y-auto">
                        {memberList.map((m) => (
                          <button
                            key={m._id}
                            onClick={() => toggleAssignee(m._id)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                                {getInitials(m.name)}
                              </span>
                            </div>
                            <span className="flex-1 text-left truncate">
                              {m.name}
                            </span>
                            {assignees.includes(m._id) && (
                              <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {assignees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {assignees.map((uid) => {
                        const name = memberNames[uid] || "Unknown";
                        return (
                          <span
                            key={uid}
                            className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg"
                          >
                            {name}
                            <button
                              onClick={() => toggleAssignee(uid)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Description with Markdown */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <AlignLeft className="w-4 h-4" />
                      Description
                    </label>
                    {!editingDesc ? (
                      <button
                        onClick={() => setEditingDesc(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            // Capture latest rich-text edits before showing markdown preview
                            if (!descPreview) {
                              setDescription(readMarkdownFromEditor());
                            }
                            setDescPreview(!descPreview);
                          }}
                          className={`inline-flex items-center gap-1 p-1 rounded transition-colors ${
                            descPreview
                              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          }`}
                          title={descPreview ? "Edit" : "Preview"}
                        >
                          {descPreview ? (
                            <Edit3 className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span className="text-xs font-medium">
                            {descPreview ? "Edit" : "Preview"}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setDescription(readMarkdownFromEditor());
                            setEditingDesc(false);
                            setDescPreview(false);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>

                  {editingDesc ? (
                    <div className="space-y-2">
                      {/* Toolbar */}
                      {!descPreview && (
                        <div className="flex items-center gap-0.5 flex-wrap p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => applyEditorCommand("bold")}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Bold"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => applyEditorCommand("italic")}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Italic"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                          <button
                            onClick={() => applyEditorCommand("insertUnorderedList")}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Bullet list"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => applyEditorCommand("insertOrderedList")}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Numbered list"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                          <button
                            onClick={createLink}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Link"
                          >
                            <Link className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={insertInlineCode}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Inline code"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={insertCodeBlock}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors text-[10px] font-mono font-bold"
                            title="Code block"
                          >
                            {"</>"}
                          </button>
                        </div>
                      )}

                      {descPreview ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 min-h-30">
                          {description ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {description}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-slate-400 dark:text-slate-500 italic">
                              No description yet
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          ref={descEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={() => setDescription(readMarkdownFromEditor())}
                          onBlur={() => setDescription(readMarkdownFromEditor())}
                          className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y min-h-30"
                          data-placeholder="Write your description… Use the toolbar for bold/italic/lists/links/code."
                        />
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingDesc(true)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 min-h-20 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                    >
                      {description ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {description}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                          Click to add a description...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ COMMENTS TAB ═══ */}
            {activeTab === "comments" && (
              <div className="p-6 space-y-4">
                {/* Comment input */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.fullName ? getInitials(user.fullName) : "?"}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleSendComment();
                        }
                      }}
                      rows={3}
                      placeholder="Write a comment... (Cmd/Ctrl+Enter to send)"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSendComment}
                        disabled={!commentText.trim() || sendingComment}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
                      >
                        {sendingComment ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                {(comments.length > 0 || commentsLoading) && (
                  <div className="border-t border-slate-200 dark:border-slate-700" />
                )}

                {/* Comments list */}
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      No comments yet. Be the first!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c._id} className="flex gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(c.author?.fullName || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {c.author?.fullName || "Unknown"}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                        {c.author?._id === user?.id && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ CHECKLIST TAB ═══ */}
            {activeTab === "checklist" && (
              <div className="p-6 space-y-4">
                {/* Progress bar */}
                {checklist.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        Progress
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {checklistProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          checklistProgress === 100
                            ? "bg-emerald-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${checklistProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Checklist items */}
                <div className="space-y-1.5">
                  {checklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 group py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleCheckItem(i)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.done
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                        }`}
                      >
                        {item.done && <Check className="w-3 h-3" />}
                      </button>
                      <span
                        className={`flex-1 text-sm transition-colors ${
                          item.done
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleRemoveCheckItem(i)}
                        className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2">
                  <input
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCheckItem();
                    }}
                    placeholder="Add an item..."
                    className="flex-1 text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={handleAddCheckItem}
                    disabled={!newCheckItem.trim()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {checklist.length === 0 && (
                  <div className="text-center py-8">
                    <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      No checklist items yet. Add your first!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ATTACHMENTS TAB ═══ */}
            {activeTab === "attachments" && (
              <div className="p-6 space-y-4">
                {/* Upload area */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">
                      {uploading
                        ? "Uploading..."
                        : "Click to upload a file"}
                    </span>
                  </button>
                </div>

                {/* Attachments list */}
                {attachmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="text-center py-8">
                    <Paperclip className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      No attachments yet. Upload your first file!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => {
                      const isImage = att.mimeType?.startsWith("image/");
                      return (
                        <div
                          key={att._id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                        >
                          {/* Preview */}
                          {isImage ? (
                            <img
                              src={`data:${att.mimeType};base64,${att.dataBase64}`}
                              alt={att.fileName}
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                              onClick={() =>
                                window.open(
                                  `data:${att.mimeType};base64,${att.dataBase64}`,
                                  "_blank",
                                )
                              }
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {att.fileName}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {formatFileSize(att.size)} •{" "}
                              {timeAgo(att.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`data:${att.mimeType};base64,${att.dataBase64}`}
                              download={att.fileName}
                              className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(att._id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Footer ─── */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={onClose}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
