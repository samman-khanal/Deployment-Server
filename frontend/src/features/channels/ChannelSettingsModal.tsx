import { useMemo, useState } from "react";
import {
  Hash,
  Lock,
  X,
  Users,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useWorkspace, getInitials } from "../workspace/WorkspaceContext";
import channelService from "../../services/channel.service";
import { useAuth } from "../../hooks/useAuth";

import type { Channel } from "../../services/channel.service";

interface ChannelSettingsModalProps {
  channel: Channel;
  onClose: () => void;
}

export default function ChannelSettingsModal({
  channel,
  onClose,
}: ChannelSettingsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    workspaceId,
    members,
    setChannels,
    myWorkspaceRole,
    isWorkspaceOwner,
  } = useWorkspace();

  const canManageChannel =
    myWorkspaceRole === "owner" || myWorkspaceRole === "admin";

  // Rename
  const [channelNameDraft, setChannelNameDraft] = useState(channel.name);
  const [isSavingChannelName, setIsSavingChannelName] = useState(false);

  // Invite members (private channels)
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [isInvitingMembers, setIsInvitingMembers] = useState(false);

  // Remove member
  const [removingChannelMemberId, setRemovingChannelMemberId] = useState<string | null>(null);

  // Delete
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [deleteChannelConfirmName, setDeleteChannelConfirmName] = useState("");

  const canRenameChannel = useMemo(() => {
    if (channel.type === "private") return canManageChannel;
    return canManageChannel;
  }, [channel.type, canManageChannel]);

  const inviteableChannelMembers = useMemo(() => {
    if (channel.type !== "private") return [];
    const currentMembers = new Set(channel.members || []);
    return members.filter(
      (member) =>
        Boolean(member.user?._id) &&
        !currentMembers.has(String(member.user._id)),
    );
  }, [members, channel]);

  const currentPrivateChannelMembers = useMemo(() => {
    if (channel.type !== "private") return [];
    const currentMembers = new Set((channel.members || []).map(String));
    return members.filter((member) =>
      currentMembers.has(String(member.user._id)),
    );
  }, [members, channel]);

  const isBusy =
    isInvitingMembers ||
    isSavingChannelName ||
    Boolean(removingChannelMemberId) ||
    isDeletingChannel;

  const handleRenameChannel = async () => {
    const nextName = channelNameDraft.trim().toLowerCase().replace(/\s+/g, "-");
    if (!nextName) {
      toast.error("Please enter a channel name");
      return;
    }
    if (nextName === channel.name) return;

    setIsSavingChannelName(true);
    try {
      const updated = await channelService.update(channel._id, {
        name: nextName,
      });
      setChannels((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
      setChannelNameDraft(updated.name);
      toast.success("Channel renamed successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to rename channel");
    } finally {
      setIsSavingChannelName(false);
    }
  };

  const handleInviteChannelMembers = async () => {
    if (selectedInviteeIds.length === 0) return;
    setIsInvitingMembers(true);
    try {
      const updated = await channelService.addMembers(
        channel._id,
        selectedInviteeIds,
      );
      setChannels((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
      setSelectedInviteeIds([]);
      toast.success("Members invited to the private channel");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to invite members to channel",
      );
    } finally {
      setIsInvitingMembers(false);
    }
  };

  const handleRemoveChannelMember = async (memberId: string) => {
    setRemovingChannelMemberId(memberId);
    try {
      const updated = await channelService.removeMember(channel._id, memberId);
      setChannels((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
      toast.success("Member removed from channel");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to remove member from channel",
      );
    } finally {
      setRemovingChannelMemberId(null);
    }
  };

  const handleDeleteChannel = async () => {
    if (deleteChannelConfirmName.trim() !== channel.name) {
      toast.error("Please type the exact channel name to confirm deletion");
      return;
    }
    setIsDeletingChannel(true);
    try {
      const deleted = await channelService.remove(channel._id);
      setChannels((prev) => prev.filter((c) => c._id !== deleted._id));
      onClose();
      navigate(`/workspaces/${workspaceId}`);
      toast.success("Channel deleted successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete channel");
    } finally {
      setIsDeletingChannel(false);
    }
  };

  const toggleInvitee = (userId: string) => {
    setSelectedInviteeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <>
      <div
        onClick={() => !isBusy && onClose()}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/70 w-full max-w-2xl animate-in zoom-in duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Channel Settings
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                {channel.type === "private"
                  ? `Manage #${channel.name}. Only invited members can access this private channel.`
                  : `Manage #${channel.name}. Everyone in this workspace can access this channel.`}
              </p>
              <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {channel.type === "private"
                  ? "Private channel access controls"
                  : "Public channel settings"}
              </div>
            </div>
            <button
              onClick={() => !isBusy && onClose()}
              disabled={isBusy}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5 bg-slate-50/60 dark:bg-slate-900/20">
            {/* Rename */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Rename Channel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Update the channel name.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Quick edit
                </span>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    label="Rename Channel"
                    hideLabel
                    type="text"
                    value={channelNameDraft}
                    onChange={(e) => setChannelNameDraft(e.target.value)}
                    className="pl-9"
                    disabled={isSavingChannelName || !canRenameChannel}
                  />
                </div>
                <Button
                  onClick={handleRenameChannel}
                  disabled={
                    isSavingChannelName ||
                    !channelNameDraft.trim() ||
                    !canRenameChannel
                  }
                  className="shrink-0 min-w-24 h-10 px-5 rounded-lg text-sm font-semibold"
                >
                  {isSavingChannelName ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              {!canRenameChannel && (
                <div className="text-xs rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-700 dark:text-amber-300">
                  Only workspace admins can rename channels.
                </div>
              )}
            </section>

            {/* Invite Members (private) */}
            {channel.type === "private" && (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Invite Members
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Select workspace members who should gain access.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
                    {selectedInviteeIds.length} selected
                  </span>
                </div>
                {inviteableChannelMembers.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/80 dark:bg-slate-900/30">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Everyone available is already invited
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inviteableChannelMembers.map((member) => {
                      const userId = String(member.user._id);
                      const isSelected = selectedInviteeIds.includes(userId);
                      return (
                        <button
                          key={member._id}
                          onClick={() => toggleInvitee(userId)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                          }`}
                        >
                          <div className="w-10 h-10 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {getInitials(member.user.fullName || "U")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {member.user.fullName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {member.user.email}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    New invitees will immediately gain access to this channel.
                  </p>
                  <Button
                    onClick={handleInviteChannelMembers}
                    disabled={
                      isInvitingMembers || selectedInviteeIds.length === 0
                    }
                    className="gap-2 h-10 px-4 rounded-lg text-sm font-semibold"
                  >
                    {isInvitingMembers ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Invite Selected
                      </>
                    )}
                  </Button>
                </div>
              </section>
            )}

            {/* Public members list */}
            {channel.type === "public" && (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Members
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Everyone in this workspace can access this channel.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {members.length} members
                  </span>
                </div>
                <div className="space-y-2">
                  {members.map((member) => {
                    const name = member.user?.fullName || "User";
                    const email = member.user?.email || "";
                    return (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20"
                      >
                        <div className="w-10 h-10 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {email}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Private current members (removable) */}
            {channel.type === "private" && (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Current Members
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Remove access for members who should no longer see this channel.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {currentPrivateChannelMembers.length} members
                  </span>
                </div>
                <div className="space-y-2">
                  {currentPrivateChannelMembers.map((member) => {
                    const memberId = String(member.user._id);
                    const isCreator =
                      String(channel.createdBy) === memberId;
                    const isRemoving = removingChannelMemberId === memberId;
                    return (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20"
                      >
                        <div className="w-10 h-10 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {getInitials(member.user.fullName || "U")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {member.user.fullName}
                            </div>
                            {isCreator && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                Creator
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {member.user.email}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleRemoveChannelMember(memberId)}
                          disabled={isCreator || isRemoving}
                          className="shrink-0 h-10 px-4 rounded-lg text-sm font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30 disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Delete Channel */}
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Channel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    This permanently removes #{channel.name} and its messages.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Permanent
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Type{" "}
                  <span className="font-semibold">{channel.name}</span>{" "}
                  to confirm deletion.
                </p>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    label="Confirm channel name"
                    hideLabel
                    type="text"
                    value={deleteChannelConfirmName}
                    onChange={(e) => setDeleteChannelConfirmName(e.target.value)}
                    className="pl-9"
                    disabled={!isWorkspaceOwner || isDeletingChannel}
                  />
                </div>
              </div>
              {!isWorkspaceOwner && (
                <div className="text-xs rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-700 dark:text-amber-300">
                  Only workspace owners can delete channels.
                </div>
              )}
              <div className="flex justify-end">
                {isWorkspaceOwner && (
                  <button
                    type="button"
                    onClick={handleDeleteChannel}
                    disabled={
                      isDeletingChannel ||
                      deleteChannelConfirmName.trim() !== channel.name
                    }
                    className="inline-flex items-center justify-center gap-2 min-w-46 px-4 h-10 rounded-lg text-sm font-medium border border-rose-600 bg-rose-600 text-white transition-all duration-200 hover:bg-rose-700 hover:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-rose-400 disabled:border-rose-400 disabled:text-white disabled:opacity-100"
                  >
                    {isDeletingChannel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Channel
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isBusy}
                className="h-10 px-4 rounded-lg text-sm font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
