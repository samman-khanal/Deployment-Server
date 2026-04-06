import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { CallModal } from "../../components/ui/CallModal";
import { CommandPalette } from "../../components/ui/CommandPalette";
import { useWebRTCCall } from "../../hooks/useWebRTCCall";
import { useWorkspace, getInitials } from "./WorkspaceContext";
import WorkspaceSidebar from "./WorkspaceSidebar";

export default function WorkspaceLayout() {
  const { members } = useWorkspace();
  const call = useWebRTCCall();

  // Sidebar responsive state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Resizable sidebar
  const SIDEBAR_MIN = 220;
  const SIDEBAR_MAX = 480;
  const SIDEBAR_DEFAULT = 256;
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-width");
      if (saved) {
        const w = Number(saved);
        if (w >= SIDEBAR_MIN && w <= SIDEBAR_MAX) return w;
      }
    } catch {}
    return SIDEBAR_DEFAULT;
  });
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, ev.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setSidebarWidth((w) => {
        try {
          localStorage.setItem("sidebar-width", String(w));
        } catch {}
        return w;
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  // Call helpers
  const callPeerName = (() => {
    if (!call.peerUserId) return "User";
    const member = members.find((m) => m.user?._id === call.peerUserId);
    return member?.user?.fullName || "User";
  })();
  const callPeerInitials = getInitials(callPeerName);

  const handleHangup = useCallback(() => {
    if (call.status === "incoming") {
      call.rejectCall("declined");
      return;
    }
    call.endCall("hangup");
  }, [call]);

  return (
    <div className="h-screen bg-white dark:bg-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <WorkspaceSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarWidth={sidebarWidth}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
      />

      {/* Sidebar resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="hidden lg:flex w-1 hover:w-1.5 cursor-col-resize items-center justify-center group z-40 shrink-0 transition-all"
      >
        <div className="w-0.5 h-8 rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Main Content — child routes render here */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        <Outlet context={{ isSidebarOpen, setIsSidebarOpen, call }} />
      </div>

      {/* Call Modal */}
      <CallModal
        open={call.status !== "idle"}
        status={call.status}
        type={call.type}
        peerName={callPeerName}
        peerInitials={callPeerInitials}
        error={call.error}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        micEnabled={call.micEnabled}
        camEnabled={call.camEnabled}
        onAccept={() => call.acceptCall()}
        onReject={() => call.rejectCall("declined")}
        onHangup={handleHangup}
        onToggleMic={() => call.toggleMic()}
        onToggleCam={() => call.toggleCam()}
      />

      {/* Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
