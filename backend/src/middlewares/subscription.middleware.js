//? Middleware for enforcing subscription limits.
import * as subscriptionService from "../services/subscription.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Middleware to check if user can create more workspaces.
export const checkWorkspaceLimit = async (req, res, next) => {
  try {
    const result = await subscriptionService.canCreateWorkspace(req.user._id);

    if (!result.allowed) {
      return res.status(HTTP.FORBIDDEN).json({
        error: "Workspace limit reached",
        message: result.reason,
        currentCount: result.currentCount,
        limit: result.limit,
        upgradeRequired: true,
      });
    }

    next();
  } catch (e) {
    next(e);
  }
};

//* Middleware to check if user can create more boards.
export const checkBoardLimit = async (req, res, next) => {
  try {
    const result = await subscriptionService.canCreateBoard(req.user._id);

    if (!result.allowed) {
      return res.status(HTTP.FORBIDDEN).json({
        error: "Board limit reached",
        message: result.reason,
        currentCount: result.currentCount,
        limit: result.limit,
        upgradeRequired: true,
      });
    }

    next();
  } catch (e) {
    next(e);
  }
};

//* Middleware to attach subscription info to request.
export const attachSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user._id);
    const limits = await subscriptionService.getUserPlanLimits(req.user._id);
    req.subscription = subscription;
    req.planLimits = limits;
    next();
  } catch (e) {
    next(e);
  }
};
