import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Hash, Lock, LayoutGrid, X } from "lucide-react";
import { useWorkspace, getInitials } from "../../features/workspace/WorkspaceContext";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { workspaceId, channels, members, sidebarBoards } = useWorkspace();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
  const basePath = `/workspaces/${workspaceId}`;

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  type CommandItem = {
    id: string;
    type: "channel" | "dm" | "board";
    label: string;
    subLabel?: string;
    icon: React.ReactNode;
    action: () => void;
  };

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Channels
    channels.forEach((ch) => {
      items.push({
        id: `channel-${ch._id}`,
        type: "channel",
        label: ch.name,
        subLabel: ch.type === "private" ? "Private channel" : "Channel",
        icon:
          ch.type === "private" ? (
            <Lock className="w-4 h-4 text-white/70" />
          ) : (
            <Hash className="w-4 h-4 text-white/70" />
          ),
        action: () => navigate(`${basePath}/channels/${ch._id}`),
      });
    });

    // DMs
    members.forEach((mem) => {
      if (!mem.user?._id) return;
      items.push({
        id: `dm-${mem._id}`,
        type: "dm",
        label: mem.user.fullName || "User",
        subLabel: "Direct Message",
        icon: (
          <div className="w-5 h-5 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-[7px] font-bold">
            {getInitials(mem.user.fullName || "U")}
          </div>
        ),
        action: () => {
          // Navigate to DM if we have a thread, otherwise to a placeholder
          navigate(basePath);
          onClose();
        },
      });
    });

    // Boards
    sidebarBoards.forEach((board) => {
      items.push({
        id: `board-${board._id}`,
        type: "board",
        label: board.name,
        subLabel: "Board",
        icon: <LayoutGrid className="w-4 h-4 text-white/70" />,
        action: () => navigate(`${basePath}/boards/${board._id}`),
      });
    });

    return items;
  }, [channels, members, sidebarBoards, basePath, navigate, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 8);
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subLabel?.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // Keep activeIndex in range
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length]);

  const handleSelect = (item: CommandItem) => {
    item.action();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const typeLabels: Record<string, string> = {
    channel: "Channels",
    dm: "People",
    board: "Boards",
  };

  // Group by type
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div
        ref={trapRef}
        className="w-full max-w-lg bg-[#1a1d4d] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Jump to channel, person, or board..."
            className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/40 text-sm">
              No results for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  {typeLabels[type] || type}
                </div>
                {items.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        globalIdx === activeIndex
                          ? "bg-indigo-600 text-white"
                          : "text-white/70 hover:bg-white/10"
                      }`}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      {item.subLabel && (
                        <span className="text-xs text-white/40 ml-auto shrink-0">
                          {item.subLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/10 text-[10px] text-white/30">
          <span><kbd className="bg-white/10 px-1 rounded font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">↵</kbd> select</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
