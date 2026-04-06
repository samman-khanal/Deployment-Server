//? Message cleanup service for deleting old messages from free plan users.
import Message from "../models/Message.model.js";
import Subscription from "../models/Subscription.model.js";
import Channel from "../models/Channel.model.js";
import DMConversation from "../models/DMConversation.model.js";
import { SUBSCRIPTION_PLANS, PLAN_LIMITS } from "../constants/subscriptionPlans.constant.js";

//* Delete old messages for free plan users.
export const cleanupFreeUserMessages = async () => {
  console.log("[MessageCleanup] Starting message cleanup for free plan users...");

  try {
    // Get all free plan subscriptions
    const freeSubscriptions = await Subscription.find({
      plan: SUBSCRIPTION_PLANS.FREE,
    }).select("user");

    const freeUserIds = freeSubscriptions.map((sub) => sub.user);

    if (freeUserIds.length === 0) {
      console.log("[MessageCleanup] No free plan users found.");
      return { deletedCount: 0 };
    }

    // Calculate the cutoff date (30 days ago)
    const retentionDays = PLAN_LIMITS[SUBSCRIPTION_PLANS.FREE].messageRetentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find all channels and DMs where the sender is a free user
    // and the message was created before the cutoff date
    const result = await Message.deleteMany({
      sender: { $in: freeUserIds },
      createdAt: { $lt: cutoffDate },
      deletedAt: null, // Don't delete already soft-deleted messages
    });

    console.log(`[MessageCleanup] Deleted ${result.deletedCount} old messages from free plan users.`);
    return { deletedCount: result.deletedCount, cutoffDate };
  } catch (error) {
    console.error("[MessageCleanup] Error during cleanup:", error);
    throw error;
  }
};

//* Get statistics about messages that will be deleted.
export const getCleanupStats = async () => {
  const freeSubscriptions = await Subscription.find({
    plan: SUBSCRIPTION_PLANS.FREE,
  }).select("user");

  const freeUserIds = freeSubscriptions.map((sub) => sub.user);

  const retentionDays = PLAN_LIMITS[SUBSCRIPTION_PLANS.FREE].messageRetentionDays;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const count = await Message.countDocuments({
    sender: { $in: freeUserIds },
    createdAt: { $lt: cutoffDate },
    deletedAt: null,
  });

  return {
    messagesToDelete: count,
    freeUsersCount: freeUserIds.length,
    cutoffDate,
    retentionDays,
  };
};

//* Schedule the cleanup job to run periodically.
let cleanupInterval = null;

export const startCleanupJob = (intervalHours = 24) => {
  // Run immediately on start
  cleanupFreeUserMessages().catch(console.error);

  // Then run periodically
  const intervalMs = intervalHours * 60 * 60 * 1000;
  cleanupInterval = setInterval(() => {
    cleanupFreeUserMessages().catch(console.error);
  }, intervalMs);

  console.log(`[MessageCleanup] Cleanup job scheduled to run every ${intervalHours} hours.`);
  return cleanupInterval;
};

export const stopCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[MessageCleanup] Cleanup job stopped.");
  }
};

export default {
  cleanupFreeUserMessages,
  getCleanupStats,
  startCleanupJob,
  stopCleanupJob,
};
