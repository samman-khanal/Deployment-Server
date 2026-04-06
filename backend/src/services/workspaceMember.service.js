//? Importing necessary modules and models.
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";

const VALID_ROLES = [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.MEMBER];

//* Service function to list all members of a workspace.
export const listMembers = async (workspaceId) =>
  WorkspaceMember.find({ workspace: workspaceId }).populate(
    "user",
    "fullName email avatarUrl",
  );

//* Service function to change a member's role in a workspace.
export const changeMemberRole = async ({ workspaceId, memberId, role }) => {
  if (!VALID_ROLES.includes(role))
    throw Object.assign(new Error("Invalid role"), { statusCode: 400 });

  const m = await WorkspaceMember.findOneAndUpdate(
    { _id: memberId, workspace: workspaceId },
    { role },
    { new: true },
  ).populate("user", "fullName email");

  if (!m)
    throw Object.assign(new Error("Member not found"), { statusCode: 404 });

  return m;
};

//* Service function to remove a member from a workspace.
export const removeMember = async ({ workspaceId, memberId, requesterId, requesterRole }) => {
  const target = await WorkspaceMember.findOne({ _id: memberId, workspace: workspaceId });
  if (!target)
    throw Object.assign(new Error("Member not found"), { statusCode: 404 });

  // Prevent owners from removing themselves (would orphan the workspace)
  if (target.role === WORKSPACE_ROLES.OWNER && String(target.user) === String(requesterId))
    throw Object.assign(new Error("Owners cannot remove themselves from the workspace"), { statusCode: 403 });

  // Only owners can remove admins or other owners
  if ((target.role === WORKSPACE_ROLES.OWNER || target.role === WORKSPACE_ROLES.ADMIN) && requesterRole !== WORKSPACE_ROLES.OWNER)
    throw Object.assign(new Error("Only the workspace owner can remove admins"), { statusCode: 403 });

  await target.deleteOne();
  return { removed: true, memberId: String(target._id), userId: String(target.user) };
};
