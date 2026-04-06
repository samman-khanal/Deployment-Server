import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  CheckSquare,
} from "lucide-react";
import type { Task } from "../services/board.service";

/* ─── Priority config ─── */

const priorityConfig: Record<
  Task["priority"],
  { label: string; color: string; bg: string; darkBg: string; icon?: boolean }
> = {
  URGENT: {
    label: "Urgent",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100",
    darkBg: "dark:bg-red-900/40",
    icon: true,
  },
  HIGH: {
    label: "High",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-100",
    darkBg: "dark:bg-orange-900/40",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100",
    darkBg: "dark:bg-blue-900/40",
  },
  LOW: {
    label: "Low",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100",
    darkBg: "dark:bg-slate-700/60",
  },
};

/* ─── Helpers ─── */

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `${diffDays}d left`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueSoon(dateStr: string): boolean {
  const diff =
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 1;
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/* ─── Props ─── */

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpen?: (task: Task) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  /** Map of userId → display name for assignee avatars */
  memberNames?: Record<string, string>;
  overlay?: boolean;
}

/* ─── Component ─── */

export default function KanbanCard({
  task,
  onEdit,
  onDelete,
  onOpen,
  onToggleComplete,
  memberNames = {},
  overlay = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pri = priorityConfig[task.priority];

  return (
    <div
      ref={!overlay ? setNodeRef : undefined}
      style={!overlay ? style : undefined}
      className={`
        group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-md transition-all duration-200 cursor-default select-none
        ${isDragging && !overlay ? "opacity-40 scale-95" : ""}
        ${overlay ? "shadow-2xl rotate-2 scale-105" : ""}
      `}
    >
      {/* Priority strip */}
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
          task.priority === "URGENT"
            ? "bg-red-500"
            : task.priority === "HIGH"
              ? "bg-orange-500"
              : task.priority === "MEDIUM"
                ? "bg-blue-500"
                : "bg-slate-300 dark:bg-slate-600"
        }`}
      />

      {/* Clickable card body */}
      <div
        className="p-3 pl-4 cursor-pointer"
        onClick={() => onOpen?.(task)}
      >
        {/* Top row: drag handle + priority badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${pri.bg} ${pri.darkBg} ${pri.color}`}
            >
              {pri.icon && <AlertTriangle className="w-3 h-3" />}
              {pri.label}
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: "none" }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Edit task"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title with completed checkbox */}
        <div className="flex items-start gap-2 mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(task._id, !task.completed);
            }}
            className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              task.completed
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400"
            }`}
            title={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed && <Check className="w-3 h-3" />}
          </button>
          <h4
            className={`text-sm font-semibold leading-snug ${
              task.completed
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {task.title}
          </h4>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 ml-6">
            {task.description}
          </p>
        )}

        {/* Bottom row: meta + indicators + assignees */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {/* Due date */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 ${
                  isOverdue(task.dueDate)
                    ? "text-red-500 dark:text-red-400 font-semibold"
                    : isDueSoon(task.dueDate)
                      ? "text-amber-500 dark:text-amber-400"
                      : ""
                }`}
                title={new Date(task.dueDate).toLocaleDateString()}
              >
                {isOverdue(task.dueDate) ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                {formatDueDate(task.dueDate)}
              </span>
            )}

            {/* Checklist indicator */}
            {task.checklist && task.checklist.length > 0 && (
              <span
                className={`inline-flex items-center gap-0.5 ${
                  task.checklist.every((i) => i.done)
                    ? "text-emerald-500 dark:text-emerald-400"
                    : ""
                }`}
                title={`Checklist: ${task.checklist.filter((i) => i.done).length}/${task.checklist.length}`}
              >
                <CheckSquare className="w-3 h-3" />
                {task.checklist.filter((i) => i.done).length}/{task.checklist.length}
              </span>
            )}
          </div>

          {/* Assignee avatars */}
          {task.assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map((uid) => {
                const name = memberNames[uid] || "?";
                return (
                  <div
                    key={uid}
                    className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-white dark:border-slate-800 flex items-center justify-center"
                    title={name}
                  >
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                      {getInitials(name)}
                    </span>
                  </div>
                );
              })}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    +{task.assignees.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
