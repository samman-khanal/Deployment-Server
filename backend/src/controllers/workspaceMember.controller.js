//? Importing necessary modules and models.
import * as memberService from "../services/workspaceMember.service.js";
import { APP_EVENTS } from "../constants/appEvents.constant.js";

//* Controller function to list all members of a workspace.
export const list = async (req, res, next) => {
  try {
    res.json(await memberService.listMembers(req.params.workspaceId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to change a member's role in a workspace.
export const changeRole = async (req, res, next) => {
  try {
    const data = await memberService.changeMemberRole({
      workspaceId: req.params.workspaceId,
      memberId: req.params.memberId,
      role: req.body.role,
    });
    req.app.get("io")
      .to(`workspace:${req.params.workspaceId}`)
      .emit(APP_EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, data);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to remove a member from a workspace.
export const remove = async (req, res, next) => {
  try {
    const result = await memberService.removeMember({
      workspaceId: req.params.workspaceId,
      memberId: req.params.memberId,
      requesterId: req.user._id,
      requesterRole: req.workspaceMember?.role,
    });
    req.app.get("io")
      .to(`workspace:${req.params.workspaceId}`)
      .emit(APP_EVENTS.WORKSPACE_MEMBER_REMOVED, {
        memberId: result.memberId,
        userId: result.userId,
        workspaceId: req.params.workspaceId,
      });
    res.json(result);
  } catch (e) {
    next(e);
  }
};
