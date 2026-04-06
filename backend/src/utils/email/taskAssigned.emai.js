import { renderEmailTemplate } from "./baseTemplate.emai.js";

//* Utility function to generate the HTML content for a task assignment email.
export const taskAssignedTemplate = ({
  assigneeName,
  taskTitle,
  dueDate,
  priority,
  workspaceName,
  boardName,
  assignedByName,
  taskUrl,
}) => {
  const dueDateLabel = dueDate ? new Date(dueDate).toLocaleString() : "Not set";
  const priorityLabel = priority || "medium";

  return renderEmailTemplate({
    preheader: `New task assigned: ${taskTitle || "Untitled Task"}`,
    greeting: `Hi ${assigneeName || "there"},`,
    title: "New Task Assignment",
    intro: `${assignedByName || "A teammate"} assigned a new task to you in ${workspaceName || "your workspace"}.`,
    sections: [
      { label: "Task", value: taskTitle || "Untitled Task" },
      { label: "Workspace", value: workspaceName || "Not provided" },
      { label: "Board", value: boardName || "Not provided" },
      { label: "Priority", value: priorityLabel },
      { label: "Due Date", value: dueDateLabel },
    ],
    ctaLabel: taskUrl ? "Open Task Board" : null,
    ctaUrl: taskUrl,
    outro: "Stay on top of progress by reviewing updates in your board.",
  });
};
