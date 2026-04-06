import { renderEmailTemplate } from "./baseTemplate.emai.js";

//* Utility function to generate the HTML content for a task comment notification email.
export const taskCommentedTemplate = ({
  recipientName,
  commenterName,
  taskTitle,
  commentText,
  workspaceName,
  boardName,
  taskUrl,
}) =>
  renderEmailTemplate({
    preheader: `New comment on ${taskTitle || "your task"}`,
    greeting: `Hi ${recipientName || "there"},`,
    title: "Task Comment Update",
    intro: `${commenterName || "A teammate"} commented on a task in ${workspaceName || "your workspace"}.`,
    sections: [
      { label: "Task", value: taskTitle || "Untitled Task" },
      { label: "Workspace", value: workspaceName || "Not provided" },
      { label: "Board", value: boardName || "Not provided" },
    ],
    quote: commentText || "(No comment text)",
    ctaLabel: taskUrl ? "Open Task Board" : null,
    ctaUrl: taskUrl,
    outro: "Review the latest discussion to keep everyone aligned.",
  });
