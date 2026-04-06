import { useNavigate, useOutletContext } from "react-router-dom";
import { Bell, Menu, Settings } from "lucide-react";
import { useWorkspace } from "../workspace/WorkspaceContext";
import { useAuth } from "../../hooks/useAuth";
import WorkspaceOverview from "../../users/WorkspaceOverview";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function OverviewPage() {
  useDocumentTitle("Overview");
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    workspaceId,
    workspace,
    channels,
    dms,
    members,
    sidebarBoards,
  } = useWorkspace();
  const { setIsSidebarOpen } = useOutletContext<{
    isSidebarOpen: boolean;
    setIsSidebarOpen: (v: boolean) => void;
  }>();

  return (
    <>
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate(`/workspaces/${workspaceId}/notifications`)
                }
                className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  navigate(`/workspaces/${workspaceId}/settings`)
                }
                className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <WorkspaceOverview
        workspace={workspace}
        channels={channels}
        dms={dms}
        members={members}
        boards={sidebarBoards}
        currentUserId={user?.id}
        onSelectChannel={(channelId) =>
          navigate(`/workspaces/${workspaceId}/channels/${channelId}`)
        }
        onOpenBoards={() =>
          navigate(`/workspaces/${workspaceId}/boards`)
        }
      />
    </>
  );
}
