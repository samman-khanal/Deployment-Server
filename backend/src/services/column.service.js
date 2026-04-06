//? Importing necessary modules and models.
import Column from "../models/Column.model.js";

//* Service function to create a new column in a board.
export const createColumn = async ({ boardId, title }) => {
  const count = await Column.countDocuments({ board: boardId });
  return Column.create({ board: boardId, title, order: count });
};

//* Service function to list all columns in a board.
export const listColumns = async (boardId) =>
  Column.find({ board: boardId }).sort({ order: 1 });

//* Service function to update a column's title.
export const updateColumn = async (columnId, patch) =>
  Column.findByIdAndUpdate(columnId, { title: patch.title }, { new: true });

//* Service function to delete a column by its ID.
export const deleteColumn = async (columnId) => {
  await Column.deleteOne({ _id: columnId });
  return { deleted: true };
};

//* Service function to reorder columns within a board.
export const reorderColumns = async ({ boardId, orderedIds }) => {
  const ops = orderedIds.map((id, idx) => ({
    updateOne: { filter: { _id: id, board: boardId }, update: { order: idx } },
  }));
  await Column.bulkWrite(ops);
  return { reordered: true };
};
