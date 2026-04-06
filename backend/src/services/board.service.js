//? Importing necessary modules and models.
import Board from "../models/Board.model.js";

//* Service function to create a new board in a workspace.
export const createBoard = async ({ workspaceId, name, userId, methodology }) =>
  Board.create({ workspace: workspaceId, name, createdBy: userId, ...(methodology && { methodology }) });

//* Service function to list all boards in a workspace.
export const listBoards = async (workspaceId) =>
  Board.find({ workspace: workspaceId }).sort({ createdAt: -1 });

//* Service function to get a board by its ID.
export const getBoard = async (boardId) => Board.findById(boardId);

//* Service function to update a board's name.
export const updateBoard = async (boardId, patch) => {
  const updates = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.methodology !== undefined) updates.methodology = patch.methodology;
  return Board.findByIdAndUpdate(boardId, updates, { new: true });
};

//* Service function to delete a board by its ID.
export const deleteBoard = async (boardId) => {
  const board = await Board.findByIdAndDelete(boardId);
  if (!board)
    throw Object.assign(new Error("Board not found"), { statusCode: 404 });
  return { deleted: true, boardId: String(board._id), workspaceId: String(board.workspace) };
};
