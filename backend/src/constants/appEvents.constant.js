//? Constants representing different application events for real-time updates.
export const APP_EVENTS = {
  BOARD_JOIN: "board:join",
  BOARD_LEAVE: "board:leave",
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_MOVED: "task:moved",
  TASK_DELETED: "task:deleted",
  MESSAGE_NEW: "message:new",

  //? Workspace structural events (sidebar / settings live updates)
  WORKSPACE_JOIN: "workspace:join",
  WORKSPACE_LEAVE: "workspace:leave",
  CHANNEL_CREATED: "workspace:channel:created",
  CHANNEL_DELETED: "workspace:channel:deleted",
  CHANNEL_UPDATED: "workspace:channel:updated",
  WORKSPACE_MEMBER_REMOVED: "workspace:member:removed",
  WORKSPACE_MEMBER_ROLE_CHANGED: "workspace:member:role:changed",
  BOARD_CREATED: "workspace:board:created",
  BOARD_DELETED: "workspace:board:deleted",
  BOARD_UPDATED: "workspace:board:updated",

  //? Chat rooms
  CHANNEL_JOIN: "channel:join",
  CHANNEL_LEAVE: "channel:leave",
  DM_JOIN: "dm:join",
  DM_LEAVE: "dm:leave",

  //? Channel messages
  CHANNEL_MESSAGE_NEW: "channel:message:new",
  CHANNEL_MESSAGE_EDITED: "channel:message:edited",
  CHANNEL_MESSAGE_DELETED: "channel:message:deleted",
  CHANNEL_MESSAGE_REACTED: "channel:message:reacted",

  //? DM messages
  DM_MESSAGE_NEW: "dm:message:new",
  DM_MESSAGE_EDITED: "dm:message:edited",
  DM_MESSAGE_DELETED: "dm:message:deleted",
  DM_MESSAGE_REACTED: "dm:message:reacted",

  //? Notifications
  NOTIFICATION_NEW: "notification:new",

  //? Calls (WebRTC signaling)
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  CALL_ICE_CANDIDATE: "call:ice-candidate",
  CALL_END: "call:end",
  CALL_REJECT: "call:reject",
  CALL_BUSY: "call:busy",

  //? Presence
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  PRESENCE_SYNC: "presence:sync",
};
