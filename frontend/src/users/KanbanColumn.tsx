import { useState, useRef, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  GripVertical,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import KanbanCard from "./KanbanCard";
import type { Task, Column } from "../services/board.service";

/* ─── Color presets for column headers ─── */

const columnColors: Record<string, string> = {
  backlog: "from-slate-500 to-slate-600",
  backlogs: "from-slate-500 to-slate-600",
  todo: "from-blue-500 to-blue-600",
  "to do": "from-blue-500 to-blue-600",
  "in progress": "from-amber-500 to-amber-600",
  doing: "from-amber-500 to-amber-600",
  review: "from-purple-500 to-purple-600",
  "in review": "from-purple-500 to-purple-600",
  done: "from-emerald-500 to-emerald-600",
  completed: "from-emerald-500 to-emerald-600",
};

const defaultGradient = "from-indigo-500 to-indigo-600";

function getColumnGradient(title: string): string {
  return columnColors[title.toLowerCase().trim()] || defaultGradient;
}

/* ─── Props ─── */

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string, title: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onOpenTask?: (task: Task) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  memberNames?: Record<string, string>;
  overlay?: boolean;
}

/* ─── Component ─── */

export default function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  onOpenTask,
  onToggleComplete,
  memberNames = {},
  overlay = false,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sortable for column itself (for column reordering)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column._id}`,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Droppable zone for tasks
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `droppable-${column._id}`,
    data: { type: "column", columnId: column._id },
  });

  /* Focus add-task input when opened */
  useEffect(() => {
    if (isAddingTask && inputRef.current) inputRef.current.focus();
  }, [isAddingTask]);

  /* Focus column title input when editing */
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  /* Close menu on outside click */
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    onAddTask(column._id, title);
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const handleSaveTitle = () => {
    const title = editedTitle.trim();
    if (title && title !== column.title) {
      onEditColumn(column._id, title);
    }
    setIsEditingTitle(false);
  };

  const gradient = getColumnGradient(column.title);
  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={!overlay ? setSortableRef : undefined}
      style={!overlay ? style : undefined}
      className={`
        flex flex-col w-64 sm:w-72 min-w-[16rem] sm:min-w-[18rem] shrink-0 max-h-full rounded-2xl
        bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60
        shadow-sm transition-all duration-200
        ${isDragging && !overlay ? "opacity-40 scale-95" : ""}
        ${overlay ? "shadow-2xl rotate-1 scale-105" : ""}
      `}
    >
      {/* Column header */}
      <div
        className={`
          flex items-center justify-between gap-2 px-3 py-2.5 rounded-t-2xl
          bg-linear-to-r ${gradient} text-white
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag handle for column */}
          <button
            {...attributes}
            {...listeners}
            style={{ touchAction: "none" }}
            className="p-0.5 cursor-grab active:cursor-grabbing rounded hover:bg-white/20 transition-colors shrink-0"
            title="Drag to reorder column"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="flex-1 min-w-0 bg-white/20 text-white placeholder-white/60 text-sm font-semibold px-2 py-0.5 rounded outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="p-0.5 hover:bg-white/20 rounded transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-0.5 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate">{column.title}</h3>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                {tasks.length}
              </span>
            </div>
          )}
        </div>

        {/* Column menu */}
        {!isEditingTitle && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setEditedTitle(column.title);
                    setIsEditingTitle(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteColumn(column._id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tasks list - droppable area */}
      <div
        ref={setDropRef}
        className={`
          flex-1 overflow-y-auto p-2 space-y-2 min-h-24
          transition-colors duration-200
          ${isOver ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}
        `}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onOpen={onOpenTask}
              onToggleComplete={onToggleComplete}
              memberNames={memberNames}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && !isAddingTask && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-600">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs">No tasks yet</p>
          </div>
        )}
      </div>

      {/* Add task area */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700/60">
        {isAddingTask ? (
          <div className="space-y-2">
            <input
              ref={inputRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
                if (e.key === "Escape") {
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                }
              }}
              placeholder="Enter task title..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add a task
          </button>
        )}
      </div>
    </div>
  );
}
