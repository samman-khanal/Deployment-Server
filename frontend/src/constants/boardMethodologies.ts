/**
 * Board methodology presets — each defines the columns
 * automatically created when a user picks that methodology.
 */

export interface BoardMethodology {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  columns: string[];
}

export const BOARD_METHODOLOGIES: BoardMethodology[] = [
  {
    id: "empty",
    name: "Empty Board",
    description: "Start from scratch with no columns",
    icon: "📋",
    columns: [],
  },
  {
    id: "kanban",
    name: "Kanban",
    description: "Visualize work flow with WIP limits",
    icon: "📊",
    columns: ["Backlog", "To Do", "In Progress", "Review", "Done"],
  },
  {
    id: "scrum",
    name: "Scrum",
    description: "Sprint-based iterative development",
    icon: "🏃",
    columns: [
      "Product Backlog",
      "Sprint Backlog",
      "In Progress",
      "In Review",
      "QA / Testing",
      "Done",
    ],
  },
  {
    id: "agile",
    name: "Agile",
    description: "Flexible, iterative project management",
    icon: "⚡",
    columns: [
      "Icebox",
      "Backlog",
      "In Development",
      "Code Review",
      "Testing",
      "Staging",
      "Released",
    ],
  },
  {
    id: "sdlc",
    name: "SDLC (Waterfall)",
    description: "Sequential software development phases",
    icon: "🔄",
    columns: [
      "Planning",
      "Requirements",
      "Design",
      "Development",
      "Testing",
      "Deployment",
      "Maintenance",
    ],
  },
  {
    id: "rup",
    name: "RUP",
    description: "Rational Unified Process — phase-driven",
    icon: "🏗️",
    columns: [
      "Inception",
      "Elaboration",
      "Construction",
      "Transition",
      "Production",
    ],
  },
  {
    id: "xp",
    name: "Extreme Programming",
    description: "Rapid iterations with continuous feedback",
    icon: "🚀",
    columns: [
      "User Stories",
      "Planning",
      "Pair Programming",
      "Testing",
      "Integration",
      "Release",
    ],
  },
  {
    id: "devops",
    name: "DevOps",
    description: "CI/CD pipeline-oriented workflow",
    icon: "🔧",
    columns: [
      "Plan",
      "Code",
      "Build",
      "Test",
      "Release",
      "Deploy",
      "Operate",
      "Monitor",
    ],
  },
];

/** Convenience: get a methodology by id, defaults to "kanban" */
export function getMethodology(id: string): BoardMethodology {
  return (
    BOARD_METHODOLOGIES.find((m) => m.id === id) ??
    BOARD_METHODOLOGIES.find((m) => m.id === "kanban")!
  );
}
