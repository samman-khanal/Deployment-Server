//? Importing necessary modules and models.
import Workspace from "../models/Workspace.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";

//* Service function to create a new workspace.
export const createWorkspace = async ({ name, description = "", ownerId }) => {
  const ws = await Workspace.create({ name, description, owner: ownerId });
  await WorkspaceMember.create({
    workspace: ws._id,
    user: ownerId,
    role: WORKSPACE_ROLES.OWNER,
  });
  return ws;
};

//* Service function to list workspaces of the logged-in user.
export const listMyWorkspaces = async (userId) => {
  const memberships = await WorkspaceMember.find({ user: userId }).populate(
    "workspace",
  );

  const workspaceIds = memberships
    .map((m) => m.workspace?._id)
    .filter(Boolean);

  const memberCounts = workspaceIds.length
    ? await WorkspaceMember.aggregate([
        { $match: { workspace: { $in: workspaceIds } } },
        { $group: { _id: "$workspace", count: { $sum: 1 } } },
      ])
    : [];

  const countByWorkspaceId = new Map(
    memberCounts.map((c) => [String(c._id), c.count]),
  );

  return memberships
    .filter((m) => !!m.workspace)
    .map((m) => ({
      ...m.workspace.toObject(),
      myRole: m.role,
      memberCount: countByWorkspaceId.get(String(m.workspace._id)) ?? 1,
    }));
};

//* Service function to get details of a specific workspace.
export const getWorkspace = async (workspaceId) => {
  const ws = await Workspace.findById(workspaceId);
  if (!ws)
    throw Object.assign(new Error("Workspace not found"), { statusCode: 404 });
  return ws;
};

//* Service function to update workspace details.
export const updateWorkspace = async (workspaceId, patch) => {
  const ws = await Workspace.findByIdAndUpdate(
    workspaceId,
    {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description }
        : {}),
    },
    { new: true },
  );
  if (!ws)
    throw Object.assign(new Error("Workspace not found"), { statusCode: 404 });
  return ws;
};

//* Service function to delete a workspace.
export const deleteWorkspace = async (workspaceId) => {
  await WorkspaceMember.deleteMany({ workspace: workspaceId });
  await Workspace.deleteOne({ _id: workspaceId });
  return { deleted: true };
};
