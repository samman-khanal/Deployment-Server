//? Importing necessary modules and models.
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

//* Authentication routes.
router.post("/register", authController.register);

//* OTP-based email verification.
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);

//* Legacy token-based email verification (kept for backward-compat).
router.get("/verify-email", authController.verifyEmail);
router.post("/verify-email", authController.verifyEmail);
router.get("/verify-email/:token", authController.verifyEmail);

router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

//* Google OAuth routes.
router.get("/google", authController.googleRedirect);
router.get("/google/callback", authController.googleCallback);

export default router;
