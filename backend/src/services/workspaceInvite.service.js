//? Importing necessary modules and models.
import WorkspaceInvite from "../models/WorkspaceInvite.model.js";
import Workspace from "../models/Workspace.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import User from "../models/User.model.js";
import { generateToken } from "../utils/generateToken.util.js";
import { sendEmail } from "../utils/sendEmail.util.js";
import { workspaceInviteTemplate } from "../utils/email/workspaceInvite.emai.js";
import { INVITATION_STATUS } from "../constants/invitationStatus.constant.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";

const twoDays = 48 * 60 * 60 * 1000;

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

//* Service function to fetch invite details by token (public preview, no auth required).
export const getInvitePreview = async (token) => {
  const inv = await WorkspaceInvite.findOne({ token }).populate("workspace", "name");
  if (!inv || inv.status !== INVITATION_STATUS.PENDING)
    throw Object.assign(new Error("Invite not found or no longer valid"), { statusCode: 404 });
  if (inv.expiresAt < new Date())
    throw Object.assign(new Error("Invite expired"), { statusCode: 400 });
  return {
    workspaceName: inv.workspace?.name ?? "Unknown Workspace",
    email: inv.email,
    expiresAt: inv.expiresAt,
  };
};

//* Service function to create a new workspace invite.
export const createInvite = async ({ workspaceId, email, invitedBy }) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace)
    throw Object.assign(new Error("Workspace not found"), { statusCode: 404 });

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail)
    throw Object.assign(new Error("Invite email is required"), {
      statusCode: 400,
    });

  const exists = await WorkspaceInvite.findOne({
    workspace: workspaceId,
    email: normalizedEmail,
    status: INVITATION_STATUS.PENDING,
  });
  if (exists)
    throw Object.assign(new Error("Invite already pending"), {
      statusCode: 409,
    });

  const token = generateToken(32);
  const invite = await WorkspaceInvite.create({
    workspace: workspaceId,
    email: normalizedEmail,
    invitedBy,
    token,
    expiresAt: new Date(Date.now() + twoDays),
  });

  //* Sending workplace invite email to the invited user.
  const inviteUrl = `${process.env.FRONTEND_URL}/invite/accept?token=${token}`;
  await sendEmail({
    to: normalizedEmail,
    subject: `You're invited to ${workspace.name} - CollabSpace`,
    html: workspaceInviteTemplate({ workspaceName: workspace.name, inviteUrl }),
  });

  return invite;
};

//* Service function to accept a workspace invite (atomic to prevent race conditions).
export const acceptInvite = async ({ token, userId }) => {
  // Atomically mark the invite as accepted in a single findOneAndUpdate.
  // This prevents two concurrent requests from both "accepting" the same invite.
  const inv = await WorkspaceInvite.findOneAndUpdate(
    { token, status: INVITATION_STATUS.PENDING },
    { status: INVITATION_STATUS.ACCEPTED },
    { new: true },
  );
  if (!inv)
    throw Object.assign(new Error("Invalid or already used invite"), { statusCode: 400 });
  if (inv.expiresAt < new Date()) {
    // Revert status so it remains useful for error messaging
    await WorkspaceInvite.updateOne({ _id: inv._id }, { status: INVITATION_STATUS.PENDING });
    throw Object.assign(new Error("Invite expired"), { statusCode: 400 });
  }

  const user = await User.findById(userId);
  if (!user)
    throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const invitedEmail = normalizeEmail(inv.email);
  const userEmail = normalizeEmail(user.email);

  if (!invitedEmail || !userEmail || userEmail !== invitedEmail) {
    // Revert so the correct user can still accept later
    await WorkspaceInvite.updateOne({ _id: inv._id }, { status: INVITATION_STATUS.PENDING });
    throw Object.assign(new Error("Invite email mismatch"), {
      statusCode: 403,
      ...(process.env.NODE_ENV === "development"
        ? { meta: { invitedEmail, userEmail } }
        : {}),
    });
  }

  await WorkspaceMember.updateOne(
    { workspace: inv.workspace, user: userId },
    { $setOnInsert: { role: WORKSPACE_ROLES.MEMBER } },
    { upsert: true },
  );

  return { accepted: true, workspaceId: inv.workspace.toString() };
};

//* Service function to reject a workspace invite.
export const rejectInvite = async ({ token, userId }) => {
  const inv = await WorkspaceInvite.findOne({
    token,
    status: INVITATION_STATUS.PENDING,
  });
  if (!inv)
    throw Object.assign(new Error("Invalid invite"), { statusCode: 400 });
  const user = await User.findById(userId);
  const invitedEmail = normalizeEmail(inv.email);
  const userEmail = normalizeEmail(user?.email);
  if (!user || !invitedEmail || !userEmail || userEmail !== invitedEmail) {
    throw Object.assign(new Error("Forbidden"), {
      statusCode: 403,
      ...(process.env.NODE_ENV === "development"
        ? { meta: { invitedEmail, userEmail } }
        : {}),
    });
  }

  inv.status = INVITATION_STATUS.REJECTED;
  await inv.save();
  return { rejected: true };
};

//* Service function to list invites of a workspace.
export const listInvites = async (workspaceId) =>
  WorkspaceInvite.find({ workspace: workspaceId });

export const cancelInvite = async (inviteId) => {
  const inv = await WorkspaceInvite.findOneAndUpdate(
    { _id: inviteId, status: INVITATION_STATUS.PENDING },
    { status: INVITATION_STATUS.CANCELLED },
  );
  if (!inv)
    throw Object.assign(new Error("Invite not found or already resolved"), { statusCode: 404 });
  return { cancelled: true };
};
