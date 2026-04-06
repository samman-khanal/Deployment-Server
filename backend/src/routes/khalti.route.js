//? Khalti routes for handling Khalti payment requests.
import { Router } from "express";
import * as khaltiController from "../controllers/khalti.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

//* Public route for prices in NPR.
router.get("/prices", khaltiController.getKhaltiPrices);

//* Protected routes.
router.use(authMiddleware);

//* Initiate Khalti payment.
router.post("/initiate", khaltiController.initiateKhaltiPayment);

//* Verify Khalti payment.
router.post("/verify", khaltiController.verifyKhaltiPayment);

//* Handle Khalti callback (from redirect).
router.get("/callback", khaltiController.handleKhaltiCallback);

//* Get Khalti payment history.
router.get("/payments", khaltiController.getKhaltiPaymentHistory);

export default router;
