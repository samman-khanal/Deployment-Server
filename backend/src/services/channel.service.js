import Channel from "../models/Channel.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";

export const createChannel = async ({
  workspaceId,
  name,
  type = "public",
  userId,
}) => {
  // must be workspace member
  const wsMember = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
  });
  if (!wsMember)
    throw Object.assign(new Error("Not a workspace member"), {
      statusCode: 403,
    });

  if (type === "private" && wsMember.role === WORKSPACE_ROLES.MEMBER)
    throw Object.assign(
      new Error("Only workspace admins or owners can create private channels"),
      { statusCode: 403 },
    );

  // creator always in members
  return Channel.create({
    workspace: workspaceId,
    name,
    type,
    createdBy: userId,
    members: [userId],
  });
};

export const listChannels = async ({ workspaceId, userId }) => {
  // Must be workspace member
  const wsMember = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
  });
  if (!wsMember)
    throw Object.assign(new Error("Not a workspace member"), {
      statusCode: 403,
    });

  // For private channels, only return ones the user is a member of
  return Channel.find({
    workspace: workspaceId,
    $or: [{ type: "public" }, { members: userId }],
  }).sort({ createdAt: -1 });
};

export const addMembersToChannel = async ({ channelId, userIds }) => {
  return Channel.findByIdAndUpdate(
    channelId,
    { $addToSet: { members: { $each: userIds } } },
    { new: true },
  );
};

export const updateChannel = async ({ channelId, name }) => {
  const patch = {};
  if (typeof name === "string" && name.trim()) patch.name = name.trim();

  return Channel.findByIdAndUpdate(channelId, patch, {
    new: true,
    runValidators: true,
  });
};

export const removeMemberFromChannel = async ({ channelId, memberId }) => {
  const channel = await Channel.findById(channelId);
  if (!channel)
    throw Object.assign(new Error("Channel not found"), { statusCode: 404 });

  if (String(channel.createdBy) === String(memberId))
    throw Object.assign(new Error("Cannot remove the channel creator"), {
      statusCode: 400,
    });

  channel.members = (channel.members || []).filter(
    (userId) => String(userId) !== String(memberId),
  );
  await channel.save();

  return channel;
};

export const deleteChannel = async ({ channelId }) => {
  const channel = await Channel.findByIdAndDelete(channelId);
  if (!channel)
    throw Object.assign(new Error("Channel not found"), { statusCode: 404 });

  return channel;
};

export const joinChannel = async ({ channelId, userId }) => {
  const channel = await Channel.findById(channelId);
  if (!channel)
    throw Object.assign(new Error("Channel not found"), { statusCode: 404 });

  // Must be workspace member
  const wsMember = await WorkspaceMember.findOne({
    workspace: channel.workspace,
    user: userId,
  });
  if (!wsMember)
    throw Object.assign(new Error("Not a workspace member"), {
      statusCode: 403,
    });

  // Private channels: no open join
  if (channel.type === "private")
    throw Object.assign(new Error("Private channel: invite required"), {
      statusCode: 403,
    });

  return Channel.findByIdAndUpdate(
    channelId,
    { $addToSet: { members: userId } },
    { new: true },
  );
};

export const leaveChannel = async ({ channelId, userId }) =>
  Channel.findByIdAndUpdate(
    channelId,
    { $pull: { members: userId } },
    { new: true },
  );
