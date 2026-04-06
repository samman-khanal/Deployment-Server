//? Importing necessary modules.
import { Router } from "express";
import * as contactController from "../controllers/contact.controller.js";

const router = Router();

//* Route to submit a contact form message.
router.post("/contact", contactController.submitContact);

export default router;
