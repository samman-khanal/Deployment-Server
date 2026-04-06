//* Constants representing subscription plan types and their limits.
export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  PLUS: "plus",
  PRO: "pro",
};

export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    maxWorkspaces: 5,
    maxBoards: 5,
    messageRetentionDays: 30, // Messages deleted after 30 days
    price: 0,
    name: "Free",
    description: "Basic plan with limited features",
  },
  [SUBSCRIPTION_PLANS.PLUS]: {
    maxWorkspaces: 15,
    maxBoards: 15,
    messageRetentionDays: Infinity, // Messages never deleted
    price: 499, // $4.99 in cents
    name: "Plus",
    description: "More workspaces & boards with permanent chat history",
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    maxWorkspaces: Infinity,
    maxBoards: Infinity,
    messageRetentionDays: Infinity, // Messages never deleted
    price: 999, // $9.99 in cents
    name: "Pro",
    description: "Unlimited workspaces, boards, and permanent chat history",
  },
};
