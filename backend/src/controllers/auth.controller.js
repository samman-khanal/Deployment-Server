//? Importing necessary modules and models.
import * as authService from "../services/auth.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to register a new user.
export const register = async (req, res, next) => {
  try {
    const fullName = req.body?.fullName ?? req.body?.fullname;
    const { email, password } = req.body;
    const data = await authService.register({ fullName, email, password });
    res.status(HTTP.CREATED).json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to verify user email via OTP.
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const data = await authService.verifyOtp({ email, otp });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to resend email verification OTP.
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await authService.resendOtp({ email });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to verify user's email (legacy token-based).
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params?.token || req.query?.token || req.body?.token;
    const data = await authService.verifyEmail({ token });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to log in a user.
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login({ email, password });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to handle forgot password requests.
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await authService.forgotPassword({ email });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to reset user's password.
export const resetPassword = async (req, res, next) => {
  try {
    const token = req.params?.token || req.body?.token;
    const { newPassword } = req.body;
    const data = await authService.resetPassword({ token, newPassword });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to redirect user to Google OAuth consent screen.
export const googleRedirect = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL;

  if (!clientId || !backendUrl) {
    return res.status(500).json({ message: "Google OAuth is not configured" });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${backendUrl}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

//* Controller function to handle Google OAuth callback and issue JWT.
export const googleCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL;

    if (error || !code) {
      return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
    }

    const data = await authService.googleAuth({ code });

    const params = new URLSearchParams({
      token: data.token,
      user: JSON.stringify(data.user),
    });

    res.redirect(`${frontendUrl}/auth/google/callback?${params}`);
  } catch (e) {
    const frontendUrl = process.env.FRONTEND_URL;
    res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
};
