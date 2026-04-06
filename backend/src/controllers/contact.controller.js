//? Importing necessary modules.
import * as contactService from "../services/contact.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to handle contact form submission.
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const data = await contactService.submitContact({ name, email, subject, message });
    res.status(HTTP.CREATED).json(data);
  } catch (e) {
    next(e);
  }
};
