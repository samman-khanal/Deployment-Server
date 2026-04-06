import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Plus,
  Loader2,
  LayoutDashboard,
  X,
  Pencil,
  Trash2,
  Calendar,
  Users,
  AlignLeft,
  Flag,
  Check,
  ChevronDown,
  Menu,
  ClipboardList,
  BarChart3,
  IterationCcw,
  Zap,
  Layers,
  Building2,
  Rocket,
  GitBranch,
  MoreVertical,
  AlertTriangle,
  Copy,
  Sparkles,
  CheckSquare,
  LayoutList,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { getSocket, EVENTS } from "../services/socket.service";
import boardService from "../services/board.service";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import TaskDetailModal from "./TaskDetailModal";
import type { Board, Column, Task } from "../services/board.service";
import type { WorkspaceMember } from "../services/workspaceMember.service";
import {
  BOARD_METHODOLOGIES,
  getMethodology,
  type BoardMethodology,
} from "../constants/boardMethodologies";

/* ─── Priority helpers ─── */

const PRIORITIES: Task["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const priorityStyles: Record<Task["priority"], { label: string; dot: string }> =
  {
    LOW: { label: "Low", dot: "bg-slate-400" },
    MEDIUM: { label: "Medium", dot: "bg-blue-500" },
    HIGH: { label: "High", dot: "bg-orange-500" },
    URGENT: { label: "Urgent", dot: "bg-red-500" },
  };

/* ─── Props ─── */

interface KanbanBoardProps {
  workspaceId: string;
  members: WorkspaceMember[];
  onOpenSidebar?: () => void;
  initialBoardId?: string | null;
  showAllKey?: number;
  onBoardsChange?: (boards: Board[]) => void;
  initialShowCreate?: boolean;
  onCreateHandled?: () => void;
}

/* ─── Component ─── */

export default function KanbanBoard({
  workspaceId,
  members,
  onOpenSidebar,
  initialBoardId,
  showAllKey,
  onBoardsChange,
  initialShowCreate,
  onCreateHandled,
}: KanbanBoardProps) {
  const { user } = useAuth();

  /* ── Determine user role in workspace ── */
  const myRole = useMemo(() => {
    if (!user) return "member";
    const me = members.find((m) => m.user._id === user.id);
    return me?.role ?? "member";
  }, [user, members]);
  const canManageBoards = myRole === "owner" || myRole === "admin";

  /* ── State: boards ── */
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [boardsLoading, setBoardsLoading] = useState(true);

  const prevInitialBoardIdRef = useRef<string | null | undefined>(undefined);

  /* ── State: columns & tasks ── */
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  /* ── State: DnD ── */
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  /* ── State: UI ── */
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  /* ── State: filters ── */
  const [filterPriority, setFilterPriority] = useState<Task["priority"] | "ALL">("ALL");
  const [filterAssignee, setFilterAssignee] = useState<string>("ALL");

  // Explicit signal from parent to return to the boards grid.
  useEffect(() => {
    if (showAllKey === undefined) return;
    setActiveBoard(null);
  }, [showAllKey]);

  useEffect(() => {
    const onBeforeUnload = () => {
      // eslint-disable-next-line no-console
      console.warn("[KanbanBoard] beforeunload fired");
    };
    const onHashChange = () => {
      // eslint-disable-next-line no-console
      console.warn("[KanbanBoard] hashchange", window.location.href);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  /* ── Open create modal if triggered from sidebar ── */
  useEffect(() => {
    if (initialShowCreate) {
      setShowCreateBoard(true);
      onCreateHandled?.();
    }
  }, [initialShowCreate]);
  const [newBoardName, setNewBoardName] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [selectedMethodology, setSelectedMethodology] =
    useState<BoardMethodology>(BOARD_METHODOLOGIES[1]); // default Kanban
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  /* ── State: board operations ── */
  const [boardMenuId, setBoardMenuId] = useState<string | null>(null);
  const [renamingBoard, setRenamingBoard] = useState<Board | null>(null);
  const [renameBoardValue, setRenameBoardValue] = useState("");
  const [renamingInProgress, setRenamingInProgress] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [duplicatingBoardId, setDuplicatingBoardId] = useState<string | null>(
    null,
  );

  const addColumnRef = useRef<HTMLInputElement>(null);
  const boardMenuRef = useRef<HTMLDivElement>(null);

  /* ── Close board menu on outside click ── */
  useEffect(() => {
    if (!boardMenuId) return;
    const handleClick = (e: MouseEvent) => {
      if (
        boardMenuRef.current &&
        !boardMenuRef.current.contains(e.target as Node)
      ) {
        setBoardMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [boardMenuId]);

  /* ── Member name map ── */
  const memberNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const mem of members) {
      const u = mem.user;
      if (u?._id) {
        m[u._id] = u.fullName;
      }
    }
    return m;
  }, [members]);

  /* ── Sensors (pointer + touch + keyboard) ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  /* ── Load boards ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBoardsLoading(true);
      try {
        const data = await boardService.listBoards(workspaceId);
        if (cancelled) return;
        setBoards(data);
        onBoardsChange?.(data);
        // Auto-select the initial board if provided
        // If initialBoardId is null, show the board grid (don't auto-select)
        if (initialBoardId) {
          const found = data.find((b) => b._id === initialBoardId);
          if (found) setActiveBoard(found);
        }
      } catch {
        toast.error("Failed to load boards");
      } finally {
        if (!cancelled) setBoardsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  /* ── Socket listeners: real-time board updates ── */
  useEffect(() => {
    const socket = getSocket();

    const onBoardCreated = (board: Board) => {
      setBoards((prev) =>
        prev.some((b) => b._id === board._id) ? prev : [...prev, board],
      );
    };

    const onBoardUpdated = (board: Board) => {
      setBoards((prev) =>
        prev.map((b) => (b._id === board._id ? board : b)),
      );
    };

    const onBoardDeleted = ({ boardId }: { boardId: string }) => {
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
      // If we're viewing the deleted board, switch back to the board grid
      if (activeBoard?._id === boardId) {
        setActiveBoard(null);
      }
    };

    socket.on(EVENTS.BOARD_CREATED, onBoardCreated);
    socket.on(EVENTS.BOARD_UPDATED, onBoardUpdated);
    socket.on(EVENTS.BOARD_DELETED, onBoardDeleted);

    return () => {
      socket.off(EVENTS.BOARD_CREATED, onBoardCreated);
      socket.off(EVENTS.BOARD_UPDATED, onBoardUpdated);
      socket.off(EVENTS.BOARD_DELETED, onBoardDeleted);
    };
  }, [activeBoard?._id]);

  /* ── Socket: join/leave board room and listen to task events ── */
  useEffect(() => {
    if (!activeBoard?._id) return;
    
    const socket = getSocket();
    
    // Join the board room to receive task updates
    socket.emit(EVENTS.BOARD_JOIN, activeBoard._id);

    // Task event handlers for real-time updates
    const onTaskCreated = (task: Task) => {
      setTasks((prev) =>
        prev.some((t) => t._id === task._id) ? prev : [...prev, task],
      );
    };

    const onTaskUpdated = (task: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? task : t)),
      );
    };

    const onTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const onTaskMoved = (task: Task) => {
      // Handle task move: remove from old location and add to new location
      setTasks((prev) => {
        const updated = prev.map((t) => (t._id === task._id ? task : t));
        // Ensure tasks are sorted by order within columns
        return updated.sort((a, b) => a.order - b.order);
      });
    };

    socket.on(EVENTS.TASK_CREATED, onTaskCreated);
    socket.on(EVENTS.TASK_UPDATED, onTaskUpdated);
    socket.on(EVENTS.TASK_DELETED, onTaskDeleted);
    socket.on(EVENTS.TASK_MOVED, onTaskMoved);

    return () => {
      socket.off(EVENTS.TASK_CREATED, onTaskCreated);
      socket.off(EVENTS.TASK_UPDATED, onTaskUpdated);
      socket.off(EVENTS.TASK_DELETED, onTaskDeleted);
      socket.off(EVENTS.TASK_MOVED, onTaskMoved);
      socket.emit(EVENTS.BOARD_LEAVE, activeBoard._id);
    };
  }, [activeBoard?._id]);

  /* ── Switch board when initialBoardId prop changes ── */
  useEffect(() => {
    if (boards.length === 0) return;

    // When parent clears the board id ("View all boards"), return to grid.
    if (!initialBoardId) {
      const prev = prevInitialBoardIdRef.current;
      prevInitialBoardIdRef.current = initialBoardId;
      if (prev) {
        if (activeBoard) setActiveBoard(null);
      }
      return;
    }

    prevInitialBoardIdRef.current = initialBoardId;

    const found = boards.find((b) => b._id === initialBoardId);
    if (found && found._id !== activeBoard?._id) {
      setActiveBoard(found);
    }
  }, [initialBoardId, boards, activeBoard]);

  /* ── Load columns + tasks when board changes ── */
  useEffect(() => {
    if (!activeBoard) {
      setColumns([]);
      setTasks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      try {
        const [cols, tsks] = await Promise.all([
          boardService.listColumns(activeBoard._id),
          boardService.listTasks(activeBoard._id),
        ]);
        if (cancelled) return;
        setColumns(cols.sort((a, b) => a.order - b.order));
        setTasks(tsks.sort((a, b) => a.order - b.order));
      } catch {
        toast.error("Failed to load board data");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBoard]);

  /* ── Tasks grouped by column (with active filters) ── */
  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) map[col._id] = [];
    for (const t of tasks) {
      if (!map[t.column]) continue;
      if (filterPriority !== "ALL" && t.priority !== filterPriority) continue;
      if (filterAssignee !== "ALL" && !t.assignees?.includes(filterAssignee)) continue;
      map[t.column].push(t);
    }
    return map;
  }, [columns, tasks, filterPriority, filterAssignee]);

  /* ── Board CRUD ── */
  const handleCreateBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    setCreatingBoard(true);
    try {
      const board = await boardService.createBoard(workspaceId, name, selectedMethodology.id);

      // Auto-create columns based on selected methodology
      if (selectedMethodology.columns.length > 0) {
        try {
          for (const colTitle of selectedMethodology.columns) {
            await boardService.createColumn(board._id, colTitle);
          }
        } catch {
          // Non-critical — board still usable without default columns
        }
      }

      // Don't add to local state or notify parent — the socket BOARD_CREATED event
      // will add it to all members' sidebars (including the creator) to avoid duplicates.
      setActiveBoard(board);
      setNewBoardName("");
      setSelectedMethodology(BOARD_METHODOLOGIES[1]);
      setShowCreateBoard(false);
      toast.success(`Board "${board.name}" created`);
    } catch {
      toast.error("Failed to create board");
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await boardService.deleteBoard(boardId);
      const updatedBoards = boards.filter((b) => b._id !== boardId);
      setBoards(updatedBoards);
      onBoardsChange?.(updatedBoards);
      if (activeBoard?._id === boardId) {
        setActiveBoard(updatedBoards[0] || null);
      }
      toast.success("Board deleted");
    } catch {
      toast.error("Failed to delete board");
    }
  };

  /* ── Board rename ── */
  const handleRenameBoard = async () => {
    if (!renamingBoard) return;
    const name = renameBoardValue.trim();
    if (!name || name === renamingBoard.name) {
      setRenamingBoard(null);
      return;
    }
    setRenamingInProgress(true);
    try {
      const updated = await boardService.updateBoard(renamingBoard._id, {
        name,
      });
      const updatedBoards = boards.map((b) =>
        b._id === updated._id ? { ...b, name: updated.name } : b,
      );
      setBoards(updatedBoards);
      onBoardsChange?.(updatedBoards);
      if (activeBoard?._id === updated._id) {
        setActiveBoard({ ...activeBoard, name: updated.name });
      }
      toast.success(`Board renamed to "${updated.name}"`);
      setRenamingBoard(null);
    } catch {
      toast.error("Failed to rename board");
    } finally {
      setRenamingInProgress(false);
    }
  };

  /* ── Board duplicate ── */
  const handleDuplicateBoard = async (board: Board) => {
    setDuplicatingBoardId(board._id);
    try {
      const newBoard = await boardService.createBoard(
        workspaceId,
        `${board.name} (copy)`,
        board.methodology,
      );
      // Copy columns from original
      try {
        const originalCols = await boardService.listColumns(board._id);
        for (const col of originalCols.sort((a, b) => a.order - b.order)) {
          await boardService.createColumn(newBoard._id, col.title);
        }
      } catch {
        // Non-critical
      }
      const updatedBoards = [...boards, newBoard];
      setBoards(updatedBoards);
      onBoardsChange?.(updatedBoards);
      toast.success(`Board duplicated as "${newBoard.name}"`);
    } catch {
      toast.error("Failed to duplicate board");
    } finally {
      setDuplicatingBoardId(null);
    }
  };

  /* ── Confirm delete board ── */
  const handleConfirmDeleteBoard = async () => {
    if (!deletingBoard) return;
    setDeleteInProgress(true);
    try {
      await boardService.deleteBoard(deletingBoard._id);
      const updatedBoards = boards.filter((b) => b._id !== deletingBoard._id);
      setBoards(updatedBoards);
      onBoardsChange?.(updatedBoards);
      if (activeBoard?._id === deletingBoard._id) {
        setActiveBoard(null);
      }
      toast.success(`Board "${deletingBoard.name}" deleted`);
      setDeletingBoard(null);
    } catch {
      toast.error("Failed to delete board");
    } finally {
      setDeleteInProgress(false);
    }
  };

  /* ── Column CRUD ── */
  const handleAddColumn = async () => {
    if (!activeBoard) return;
    const title = newColumnTitle.trim();
    if (!title) return;
    try {
      const col = await boardService.createColumn(activeBoard._id, title);
      setColumns((prev) => [...prev, col]);
      setNewColumnTitle("");
      setShowAddColumn(false);
    } catch {
      toast.error("Failed to create column");
    }
  };

  const handleEditColumn = async (columnId: string, title: string) => {
    try {
      const updated = await boardService.updateColumn(columnId, { title });
      setColumns((prev) => prev.map((c) => (c._id === columnId ? updated : c)));
    } catch {
      toast.error("Failed to update column");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await boardService.deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c._id !== columnId));
      setTasks((prev) => prev.filter((t) => t.column !== columnId));
      toast.success("Column deleted");
    } catch {
      toast.error("Failed to delete column");
    }
  };

  /* ── Task CRUD ── */
  const handleAddTask = async (columnId: string, title: string) => {
    if (!activeBoard) return;
    try {
      await boardService.createTask(
        activeBoard._id,
        columnId,
        title,
      );
      // Don't add to local state — the socket TASK_CREATED event will add it
      // to all members (including the creator) to avoid duplicates.
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await boardService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<
      Pick<Task, "title" | "description" | "assignees" | "dueDate" | "priority" | "completed" | "checklist">
    >,
  ) => {
    try {
      const updated = await boardService.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      setEditingTask((prev) => (prev?._id === taskId ? updated : prev));
      setViewingTask((prev) => (prev?._id === taskId ? updated : prev));
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const updated = await boardService.updateTask(taskId, { completed });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      setViewingTask((prev) => (prev?._id === taskId ? updated : prev));
    } catch {
      toast.error("Failed to update task");
    }
  };

  /* ── Drag handlers ── */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === "task") {
      setActiveTask(data.task);
    } else if (data?.type === "column") {
      setActiveColumn(data.column);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle task-over-task or task-over-column
    if (activeData?.type !== "task") return;

    const activeTaskId = active.id as string;
    const activeTask = tasks.find((t) => t._id === activeTaskId);
    if (!activeTask) return;

    let targetColumnId: string | null = null;

    if (overData?.type === "task") {
      // Dragging over another task — find its column
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) targetColumnId = overTask.column;
    } else if (overData?.type === "column") {
      // Dragging over a column droppable zone
      targetColumnId = overData.columnId;
    }

    if (!targetColumnId || targetColumnId === activeTask.column) return;

    // Move task to new column optimistically
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t._id === activeTaskId ? { ...t, column: targetColumnId! } : t,
      );
      return updated;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    /* ── Column reorder ── */
    if (activeData?.type === "column" && overData?.type === "column") {
      const activeColId = (active.id as string).replace("column-", "");
      const overColId = (over.id as string).replace("column-", "");
      if (activeColId === overColId) return;

      const oldIndex = columns.findIndex((c) => c._id === activeColId);
      const newIndex = columns.findIndex((c) => c._id === overColId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(columns, oldIndex, newIndex);
      setColumns(reordered);

      try {
        await boardService.reorderColumns(
          activeBoard!._id,
          reordered.map((c) => c._id),
        );
      } catch {
        toast.error("Failed to reorder columns");
      }
      return;
    }

    /* ── Task reorder / move ── */
    if (activeData?.type === "task") {
      const taskId = active.id as string;
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;

      // Figure out the column the task is now in (from dragOver)
      const colTasks = tasks
        .filter((t) => t.column === task.column)
        .sort((a, b) => a.order - b.order);

      // Find the index of the over target within the same column
      let newIndex = colTasks.length - 1;
      if (overData?.type === "task") {
        const overIdx = colTasks.findIndex((t) => t._id === over.id);
        if (overIdx !== -1) newIndex = overIdx;
      }

      try {
        await boardService.moveTask(taskId, task.column, newIndex);
        // Refresh tasks to get proper ordering
        if (activeBoard) {
          const refreshed = await boardService.listTasks(activeBoard._id);
          setTasks(refreshed.sort((a, b) => a.order - b.order));
        }
      } catch {
        toast.error("Failed to move task");
      }
    }
  };

  /* ── Focus add-column input ── */
  useEffect(() => {
    if (showAddColumn && addColumnRef.current) addColumnRef.current.focus();
  }, [showAddColumn]);

  /* ─────────────── RENDER ─────────────── */

  /* Board list view (no active board) */
  if (boardsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-linear-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Header — only show for active board */}
      {activeBoard && (
        <header className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {onOpenSidebar && (
              <button
                onClick={onOpenSidebar}
                className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <LayoutDashboard className="w-5 h-5 text-indigo-500 shrink-0 hidden sm:block" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {activeBoard.name}
              </h1>
            </div>

            {boards.length > 1 && (
              <BoardSwitcher
                boards={boards}
                activeBoard={activeBoard}
                onSelect={setActiveBoard}
                onDelete={handleDeleteBoard}
              />
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowAddColumn(true)}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Column</span>
            </button>
            <button
              onClick={() => setShowCreateBoard(true)}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>
        </header>
      )}

      {/* Filter bar — only show for active board */}
      {activeBoard && (
        <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">Filter:</span>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Task["priority"] | "ALL")}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer max-w-40"
          >
            <option value="ALL">All members</option>
            {members.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.fullName}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {(filterPriority !== "ALL" || filterAssignee !== "ALL") && (
            <button
              onClick={() => { setFilterPriority("ALL"); setFilterAssignee("ALL"); }}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Main area */}
      {!activeBoard ? (
        /* Board selection grid */
        <div className="flex-1 overflow-auto">
          {/* Hero banner */}
          <div className="relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-400/5 dark:bg-indigo-500/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-400/5 dark:bg-violet-500/5 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-cyan-400/3 dark:bg-cyan-500/3 blur-3xl" />
            </div>

            {/* Mobile top bar — hamburger only, no active board */}
            <div className="lg:hidden shrink-0 flex items-center px-2 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
              {onOpenSidebar && (
                <button
                  onClick={onOpenSidebar}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  aria-label="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-2">
              {/* Title area */}
              <div className="flex items-center gap-4 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Boards & Tasks
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Organize and track your team's work
                  </p>
                </div>
              </div>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6 py-16">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden w-full max-w-2xl">
                <div className="text-center py-12 px-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center">
                        <LayoutDashboard className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Create your first board
                  </h2>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
                    Boards help you organize tasks, track progress, and collaborate with your team.
                  </p>

                  <button
                    onClick={() => setShowCreateBoard(true)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] mb-10"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Board
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-8 max-w-md mx-auto">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-5">
                      Everything you need to manage tasks
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      {[
                        { icon: LayoutDashboard, label: "Boards", desc: "Organize your workflow" },
                        { icon: LayoutList, label: "Columns", desc: "Customizable stages" },
                        { icon: CheckSquare, label: "Tasks", desc: "Track work items" },
                        { icon: Users, label: "Teams", desc: "Assign & collaborate" },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                            <item.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 block">
                              {item.label}
                            </span>
                            <span className="text-[12px] text-slate-400 dark:text-slate-500">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section header */}
              <div className="px-6 sm:px-8 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      All Boards
                    </h2>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                      {boards.length} board{boards.length !== 1 ? "s" : ""} in
                      this workspace
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6 sm:px-8 pb-8">
                {boards.map((board, idx) => {
                  const palettes = [
                    {
                      from: "#6366f1",
                      via: "#818cf8",
                      to: "#a78bfa",
                      border: "hover:border-indigo-400 dark:hover:border-indigo-500",
                      accent: "indigo",
                    },
                    {
                      from: "#f43f5e",
                      via: "#fb7185",
                      to: "#fb923c",
                      border: "hover:border-rose-400 dark:hover:border-rose-500",
                      accent: "rose",
                    },
                    {
                      from: "#0891b2",
                      via: "#22d3ee",
                      to: "#38bdf8",
                      border: "hover:border-cyan-400 dark:hover:border-cyan-500",
                      accent: "cyan",
                    },
                    {
                      from: "#059669",
                      via: "#34d399",
                      to: "#6ee7b7",
                      border: "hover:border-emerald-400 dark:hover:border-emerald-500",
                      accent: "emerald",
                    },
                    {
                      from: "#d97706",
                      via: "#fbbf24",
                      to: "#fde68a",
                      border: "hover:border-amber-400 dark:hover:border-amber-500",
                      accent: "amber",
                    },
                    {
                      from: "#7c3aed",
                      via: "#a78bfa",
                      to: "#e879f9",
                      border: "hover:border-violet-400 dark:hover:border-violet-500",
                      accent: "violet",
                    },
                    {
                      from: "#0d9488",
                      via: "#2dd4bf",
                      to: "#67e8f9",
                      border: "hover:border-teal-400 dark:hover:border-teal-500",
                      accent: "teal",
                    },
                    {
                      from: "#ea580c",
                      via: "#f97316",
                      to: "#fb923c",
                      border: "hover:border-orange-400 dark:hover:border-orange-500",
                      accent: "orange",
                    },
                    {
                      from: "#2563eb",
                      via: "#60a5fa",
                      to: "#93c5fd",
                      border: "hover:border-blue-400 dark:hover:border-blue-500",
                      accent: "blue",
                    },
                    {
                      from: "#65a30d",
                      via: "#a3e635",
                      to: "#d9f99d",
                      border: "hover:border-lime-400 dark:hover:border-lime-500",
                      accent: "lime",
                    },
                  ];
                  const palette = palettes[idx % palettes.length];
                  return (
                    <div key={board._id} className="group relative">
                      {/* Card body — no overflow-hidden so menu can escape */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveBoard(board);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveBoard(board);
                          }
                        }}
                        className={`relative w-full text-left rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1.5 border-2 border-transparent ${palette.border} transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                      >
                        {/* Gradient area */}
                        <div
                          className="relative h-36 rounded-t-2xl overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.via} 50%, ${palette.to} 100%)`,
                          }}
                        >
                          {/* Animated mesh shapes */}
                          <div className="absolute inset-0">
                            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/8 group-hover:bg-white/15 group-hover:scale-110 transition-all duration-700 ease-out" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/6 group-hover:bg-white/12 group-hover:scale-110 transition-all duration-700 ease-out delay-75" />
                            <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-125 transition-all duration-700 ease-out delay-100" />
                            {/* Sparkle dots */}
                            <div className="absolute top-5 left-1/4 w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-white/60 transition-all duration-500" />
                            <div className="absolute top-1/3 right-8 w-1 h-1 rounded-full bg-white/25 group-hover:bg-white/50 transition-all duration-500 delay-100" />
                            <div className="absolute bottom-6 right-1/3 w-1 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-all duration-500 delay-150" />
                          </div>

                          {/* Glassmorphic icon badge */}
                          <div className="absolute top-4 left-4">
                            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg shadow-black/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 ease-out">
                              <LayoutDashboard className="w-5 h-5 text-white drop-shadow" />
                            </div>
                          </div>

                          {/* Open arrow hint */}
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 ease-out">
                            <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/15 text-xs font-semibold text-white shadow-lg">
                              Open →
                            </div>
                          </div>
                        </div>

                        {/* Footer — white card feel */}
                        <div
                          className="px-4 py-3.5 bg-white dark:bg-slate-800 rounded-b-2xl border-t border-slate-100 dark:border-slate-700/60"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-snug truncate flex-1 min-w-0">
                              {board.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              <Calendar className="w-3 h-3" />
                              {new Date(board.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {/* Methodology tag */}
                            {(() => {
                              const m = getMethodology(board.methodology ?? "empty");
                              return (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                                  style={{
                                    background: `linear-gradient(135deg, ${palette.from}18, ${palette.to}22)`,
                                    color: palette.from,
                                    border: `1px solid ${palette.from}25`,
                                  }}
                                >
                                  <span className="text-[10px] leading-none">{m.icon}</span>
                                  {m.name}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* 3-dot menu OUTSIDE overflow-hidden so dropdown isn't clipped */}
                      {canManageBoards && (
                        <div
                          className="absolute top-3 right-3 z-20"
                          ref={
                            boardMenuId === board._id ? boardMenuRef : undefined
                          }
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBoardMenuId(
                                boardMenuId === board._id ? null : board._id,
                              );
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/30 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {boardMenuId === board._id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-black/15 border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBoardMenuId(null);
                                  setRenamingBoard(board);
                                  setRenameBoardValue(board.name);
                                }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                  <Pencil className="w-3.5 h-3.5" />
                                </div>
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBoardMenuId(null);
                                  handleDuplicateBoard(board);
                                }}
                                disabled={duplicatingBoardId === board._id}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50"
                              >
                                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                  <Copy className="w-3.5 h-3.5" />
                                </div>
                                {duplicatingBoardId === board._id
                                  ? "Duplicating…"
                                  : "Duplicate"}
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700 my-1.5 mx-3" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBoardMenuId(null);
                                  setDeletingBoard(board);
                                }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </div>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Create new board card */}
                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/60 dark:bg-slate-800/40 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/20 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer"
                  style={{ minHeight: "calc(9rem + 3.5rem + 1px)" }}
                >
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-all duration-300 ease-out">
                    <Plus className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">
                    Create New Board
                  </span>
                  <span className="text-[11px] font-medium opacity-50">
                    Click to get started
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : dataLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        /* Kanban columns */
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 items-start h-full min-w-max">
              <SortableContext
                items={columns.map((c) => `column-${c._id}`)}
                strategy={horizontalListSortingStrategy}
              >
                {columns.map((col) => (
                  <KanbanColumn
                    key={col._id}
                    column={col}
                    tasks={tasksByColumn[col._id] || []}
                    onAddTask={handleAddTask}
                    onEditTask={(task) => setEditingTask(task)}
                    onDeleteTask={handleDeleteTask}
                    onEditColumn={handleEditColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onOpenTask={(task) => setViewingTask(task)}
                    onToggleComplete={handleToggleComplete}
                    memberNames={memberNames}
                  />
                ))}
              </SortableContext>

              {/* Add column inline */}
              {showAddColumn ? (
                <div className="w-72 min-w-72 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3 space-y-2">
                  <input
                    ref={addColumnRef}
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setShowAddColumn(false);
                        setNewColumnTitle("");
                      }
                    }}
                    placeholder="Column title..."
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      disabled={!newColumnTitle.trim()}
                      className="flex-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Add Column
                    </button>
                    <button
                      onClick={() => {
                        setShowAddColumn(false);
                        setNewColumnTitle("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddColumn(true)}
                  className="w-72 min-w-72 shrink-0 flex items-center justify-center gap-2 py-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Add Column</span>
                </button>
              )}
            </div>

            {/* Drag overlays */}
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeTask && (
                <KanbanCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  memberNames={memberNames}
                  overlay
                />
              )}
              {activeColumn && (
                <KanbanColumn
                  column={activeColumn}
                  tasks={tasksByColumn[activeColumn._id] || []}
                  onAddTask={() => {}}
                  onEditTask={() => {}}
                  onDeleteTask={() => {}}
                  onEditColumn={() => {}}
                  onDeleteColumn={() => {}}
                  memberNames={memberNames}
                  overlay
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* ─── Create Board Modal ─── */}
      {showCreateBoard && (
        <>
          <div
            onClick={() => !creatingBoard && setShowCreateBoard(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create a board
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Pick a methodology to set up your workflow
                  </p>
                </div>
                <button
                  onClick={() => !creatingBoard && setShowCreateBoard(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Board name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Board Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newBoardName.trim())
                        handleCreateBoard();
                    }}
                    placeholder="e.g. Sprint 1, Product Roadmap..."
                    autoFocus
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Methodology selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Methodology
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BOARD_METHODOLOGIES.map((m) => {
                      const iconMap: Record<
                        string,
                        { icon: React.ReactNode; bg: string; text: string }
                      > = {
                        empty: {
                          icon: <ClipboardList className="w-6 h-6" />,
                          bg: "bg-slate-100 dark:bg-slate-700",
                          text: "text-slate-500 dark:text-slate-300",
                        },
                        kanban: {
                          icon: <BarChart3 className="w-6 h-6" />,
                          bg: "bg-indigo-100 dark:bg-indigo-900/40",
                          text: "text-indigo-600 dark:text-indigo-400",
                        },
                        scrum: {
                          icon: <IterationCcw className="w-6 h-6" />,
                          bg: "bg-violet-100 dark:bg-violet-900/40",
                          text: "text-violet-600 dark:text-violet-400",
                        },
                        agile: {
                          icon: <Zap className="w-6 h-6" />,
                          bg: "bg-amber-100 dark:bg-amber-900/40",
                          text: "text-amber-600 dark:text-amber-400",
                        },
                        sdlc: {
                          icon: <Layers className="w-6 h-6" />,
                          bg: "bg-cyan-100 dark:bg-cyan-900/40",
                          text: "text-cyan-600 dark:text-cyan-400",
                        },
                        rup: {
                          icon: <Building2 className="w-6 h-6" />,
                          bg: "bg-rose-100 dark:bg-rose-900/40",
                          text: "text-rose-600 dark:text-rose-400",
                        },
                        xp: {
                          icon: <Rocket className="w-6 h-6" />,
                          bg: "bg-emerald-100 dark:bg-emerald-900/40",
                          text: "text-emerald-600 dark:text-emerald-400",
                        },
                        devops: {
                          icon: <GitBranch className="w-6 h-6" />,
                          bg: "bg-orange-100 dark:bg-orange-900/40",
                          text: "text-orange-600 dark:text-orange-400",
                        },
                      };
                      const style = iconMap[m.id] ?? iconMap.empty;
                      const isSelected = selectedMethodology.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethodology(m)}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/30"
                              : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center mb-3`}
                          >
                            {style.icon}
                          </div>
                          <span className="block text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                            {m.name}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-1">
                            {m.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column preview */}
                {selectedMethodology.columns.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                      Columns that will be created
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMethodology.columns.map((col) => (
                        <span
                          key={col}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setShowCreateBoard(false)}
                  disabled={creatingBoard}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || creatingBoard}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors shadow-sm"
                >
                  {creatingBoard ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-4 h-4" />
                      Create Board
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Rename Board Modal ─── */}
      {renamingBoard && (
        <>
          <div
            onClick={() => !renamingInProgress && setRenamingBoard(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Rename Board
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Change the name of this board
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !renamingInProgress && setRenamingBoard(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Board Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={renameBoardValue}
                  onChange={(e) => setRenameBoardValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameBoardValue.trim())
                      handleRenameBoard();
                  }}
                  autoFocus
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setRenamingBoard(null)}
                  disabled={renamingInProgress}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameBoard}
                  disabled={!renameBoardValue.trim() || renamingInProgress}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors shadow-sm"
                >
                  {renamingInProgress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Delete Board Confirmation ─── */}
      {deletingBoard && (
        <>
          <div
            onClick={() => !deleteInProgress && setDeletingBoard(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Delete Board
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 mb-2">
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-bold">"{deletingBoard.name}"</span>?
                    All columns and tasks in this board will be permanently
                    removed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setDeletingBoard(null)}
                  disabled={deleteInProgress}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteBoard}
                  disabled={deleteInProgress}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors shadow-sm"
                >
                  {deleteInProgress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Board
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Task Edit Modal (quick edit from pencil icon) ─── */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          members={members}
          memberNames={memberNames}
          onUpdate={handleUpdateTask}
          onClose={() => setEditingTask(null)}
          onDelete={handleDeleteTask}
        />
      )}

      {/* ─── Task Detail Modal (full view from card click) ─── */}
      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          members={members}
          memberNames={memberNames}
          onUpdate={handleUpdateTask}
          onClose={() => setViewingTask(null)}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Board Switcher (dropdown)
   ──────────────────────────────────────────── */

function BoardSwitcher({
  boards,
  activeBoard,
  onSelect,
  onDelete,
}: {
  boards: Board[];
  activeBoard: Board;
  onSelect: (b: Board) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    const handleResize = () => setOpen(false);
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: Math.min(rect.left, Math.max(8, window.innerWidth - 232)),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-label="Switch board"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 rounded-lg transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed w-56 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-black/15 border border-slate-200 dark:border-slate-700 py-1 z-200 animate-in fade-in zoom-in-95 duration-150 origin-top-left"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Switch Board</p>
          </div>
          {boards.map((b) => (
            <div
              key={b._id}
              className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                b._id === activeBoard._id
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <span
                className="flex-1 truncate"
                onClick={() => {
                  onSelect(b);
                  setOpen(false);
                }}
              >
                {b.name}
              </span>
              {b._id !== activeBoard._id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(b._id);
                    setOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

/* ────────────────────────────────────────────
   Task Edit Modal
   ──────────────────────────────────────────── */

function TaskEditModal({
  task,
  members,
  memberNames,
  onUpdate,
  onClose,
  onDelete,
}: {
  task: Task;
  members: WorkspaceMember[];
  memberNames: Record<string, string>;
  onUpdate: (
    id: string,
    updates: Partial<
      Pick<Task, "title" | "description" | "assignees" | "dueDate" | "priority">
    >,
  ) => Promise<void>;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [assignees, setAssignees] = useState<string[]>(task.assignees);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  /* Reset state when task changes */
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setAssignees(task.assignees);
  }, [task]);

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

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task._id, {
        title: title.trim() || task.title,
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
        assignees,
      });
      onClose();
      toast.success("Task updated");
    } catch {
      // error handled in parent
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignee = (uid: string) => {
    setAssignees((prev) =>
      prev.includes(uid) ? prev.filter((a) => a !== uid) : [...prev, uid],
    );
  };

  const memberList = members
    .map((m) => {
      const u = m.user;
      if (u?._id) return { _id: u._id, name: u.fullName };
      return null;
    })
    .filter(Boolean) as { _id: string; name: string }[];

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Edit Task
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDelete(task._id);
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Pencil className="w-4 h-4" />
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <AlignLeft className="w-4 h-4" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add a description..."
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Flag className="w-4 h-4" />
                Priority
              </label>
              <div className="flex gap-2">
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
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Users className="w-4 h-4" />
                Assignees
              </label>

              <div className="relative" ref={assigneeRef}>
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full flex items-center justify-between text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500"
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
                    {memberList.length === 0 && (
                      <p className="text-sm text-slate-400 dark:text-slate-500 px-3 py-2">
                        No members found
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected assignee chips */}
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
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
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
