//? Importing necessary modules and models.
import * as workspaceService from "../services/workspace.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to create a new workspace.
export const create = async (req, res, next) => {
  try {
    const ws = await workspaceService.createWorkspace({
      name: req.body.name,
      description: req.body.description,
      ownerId: req.user._id,
    });
    res.status(HTTP.CREATED).json(ws);
  } catch (e) {
    next(e);
  }
};

//* Controller function to list workspaces of the logged-in user.
export const listMine = async (req, res, next) => {
  try {
    res.json(await workspaceService.listMyWorkspaces(req.user._id));
  } catch (e) {
    next(e);
  }
};

//* Controller function to get details of a specific workspace.
export const getOne = async (req, res, next) => {
  try {
    res.json(await workspaceService.getWorkspace(req.params.workspaceId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to update workspace details.
export const update = async (req, res, next) => {
  try {
    res.json(
      await workspaceService.updateWorkspace(req.params.workspaceId, req.body),
    );
  } catch (e) {
    next(e);
  }
};

//* Controller function to delete a workspace.
export const remove = async (req, res, next) => {
  try {
    res.json(await workspaceService.deleteWorkspace(req.params.workspaceId));
  } catch (e) {
    next(e);
  }
};
