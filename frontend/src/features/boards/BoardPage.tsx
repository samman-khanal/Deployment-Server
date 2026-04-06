import { useEffect, useState } from "react";
import { useParams, useOutletContext, useLocation } from "react-router-dom";
import { useWorkspace } from "../workspace/WorkspaceContext";
import KanbanBoard from "../../users/KanbanBoard";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function BoardPage() {
  useDocumentTitle("Boards");
  const { boardId } = useParams<{ boardId: string }>();
  const location = useLocation();
  const { workspaceId, members, setSidebarBoards } = useWorkspace();
  const { setIsSidebarOpen } = useOutletContext<{
    isSidebarOpen: boolean;
    setIsSidebarOpen: (v: boolean) => void;
  }>();

  const [viewAllKey, setViewAllKey] = useState(0);

  // Bump key whenever we navigate to /boards (no boardId) so KanbanBoard
  // resets to the board grid — even if the URL hasn't changed (e.g. user
  // created a board while already on /boards, then clicks "View all boards").
  useEffect(() => {
    if (!boardId) {
      setViewAllKey((k) => k + 1);
    }
  }, [location.key, boardId]);

  return (
    <KanbanBoard
      workspaceId={workspaceId}
      members={members}
      onOpenSidebar={() => setIsSidebarOpen(true)}
      initialBoardId={boardId || null}
      showAllKey={boardId ? undefined : viewAllKey}
      onBoardsChange={(boards) => setSidebarBoards(boards)}
    />
  );
}
