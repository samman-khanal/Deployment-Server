import { renderEmailTemplate } from "./baseTemplate.emai.js";

//* Utility function to generate the HTML content for a workspace invitation email.
export const workspaceInviteTemplate = ({ workspaceName, inviteUrl }) =>
  renderEmailTemplate({
    preheader: `You're invited to join ${workspaceName || "a workspace"}.`,
    title: "Workspace Invitation",
    intro:
      "You have been invited to collaborate in CollabSpace. Join your team workspace to participate in tasks, boards, and conversations.",
    sections: [{ label: "Workspace", value: workspaceName || "Team Workspace" }],
    ctaLabel: "Accept Invitation",
    ctaUrl: inviteUrl,
    outro:
      "If this invitation was not intended for you, you can safely ignore this message.",
  });
