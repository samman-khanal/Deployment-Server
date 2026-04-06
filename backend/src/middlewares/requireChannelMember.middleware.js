import Channel from "../models/Channel.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import { HTTP } from "../constants/httpStatus.constant.js";

export default async function requireChannelMember(req, res, next) {
  const channelId = req.params.channelId;
  const channel = await Channel.findById(channelId);
  if (!channel)
    return res.status(HTTP.NOT_FOUND).json({ message: "Channel not found" });

  // must be in the workspace
  const wsMember = await WorkspaceMember.findOne({
    workspace: channel.workspace,
    user: req.user._id,
  });
  if (!wsMember)
    return res
      .status(HTTP.FORBIDDEN)
      .json({ message: "Not a workspace member" });

  // if private, must be in channel.members
  if (channel.type === "private") {
    const inChannel = channel.members.some(
      (id) => String(id) === String(req.user._id),
    );
    if (!inChannel)
      return res
        .status(HTTP.FORBIDDEN)
        .json({ message: "Not a channel member" });
  }

  req.channel = channel;
  req.workspaceMember = wsMember;
  next();
}
