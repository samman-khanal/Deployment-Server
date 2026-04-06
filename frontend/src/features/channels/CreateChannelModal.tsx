import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Lock, Globe, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useWorkspace } from "../workspace/WorkspaceContext";
import channelService from "../../services/channel.service";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface CreateChannelModalProps {
  onClose: () => void;
}

export default function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const navigate = useNavigate();
  const { workspaceId, myWorkspaceRole, setChannels } = useWorkspace();

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  const canCreatePrivateChannel =
    myWorkspaceRole === "owner" || myWorkspaceRole === "admin";

  const handleCreateChannel = async () => {
    if (!workspaceId) return;
    const name = newChannelName.trim();
    if (!name) {
      toast.error("Please enter a channel name");
      return;
    }

    setIsCreatingChannel(true);
    try {
      const created = await channelService.create(workspaceId, {
        name,
        type: newChannelPrivate ? "private" : "public",
      });
      // Add to context immediately so ChannelPage can find it on navigation
      setChannels((prev) =>
        prev.some((c) => c._id === created._id) ? prev : [...prev, created],
      );
      toast.success(`Channel #${created.name} created successfully!`);
      onClose();
      navigate(`/workspaces/${workspaceId}/channels/${created._id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  return (
    <>
      <div
        onClick={() => !isCreatingChannel && onClose()}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div ref={trapRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Create a channel
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Start a new conversation with your team
              </p>
            </div>
            <button
              onClick={() => !isCreatingChannel && onClose()}
              disabled={isCreatingChannel}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="channel-name"
                className="block text-sm font-semibold text-slate-900 dark:text-white mb-2"
              >
                Channel Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  label="Channel Name"
                  hideLabel
                  id="channel-name"
                  type="text"
                  placeholder="e.g., project-updates"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="pl-10"
                  disabled={isCreatingChannel}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Channel names must be lowercase, without spaces or periods.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <button
                onClick={() => {
                  if (!canCreatePrivateChannel) return;
                  setNewChannelPrivate(!newChannelPrivate);
                }}
                className={`w-12 h-7 rounded-full transition-all ${
                  newChannelPrivate ? "bg-indigo-600" : "bg-slate-300"
                }`}
                disabled={isCreatingChannel || !canCreatePrivateChannel}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    newChannelPrivate ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {newChannelPrivate ? (
                    <Lock className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  )}
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {newChannelPrivate ? "Private" : "Public"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {newChannelPrivate
                    ? "Only invited members can access"
                    : "Anyone in the workspace can join"}
                </p>
                {!canCreatePrivateChannel && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Only workspace admins or owners can create private channels.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isCreatingChannel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={isCreatingChannel || !newChannelName.trim()}
                className="flex-1 gap-2"
              >
                {isCreatingChannel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4" />
                    Create Channel
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
