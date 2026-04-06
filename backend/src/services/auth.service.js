//? Importing necessary modules and models.
import User from "../models/User.model.js";
import EmailVerification from "../models/EmailVerification.model.js";
import ResetPassword from "../models/ResetPassword.model.js";
import { hashPassword } from "../utils/hashPassword.util.js";
import { comparePassword } from "../utils/comparePassword.util.js";
import { signAccessToken } from "../utils/jwt.util.js";
import { generateToken } from "../utils/generateToken.util.js";
import { sendEmail } from "../utils/sendEmail.util.js";
import { verifyOtpTemplate } from "../utils/email/verifyOtp.email.js";
import { resetPasswordTemplate } from "../utils/email/resetPassword.emai.js";
import { createFreeSubscription } from "./subscription.service.js";

const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;
const fifteenMinutes = 15 * 60 * 1000;

//* Generate a 6-digit OTP string.
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

//* Service function to register a new user.
export const register = async ({ fullName, email, password }) => {
  const exists = await User.findOne({ email });
  if (exists)
    throw Object.assign(new Error("Email already in use"), { statusCode: 409 });

  const user = await User.create({
    fullName,
    email,
    passwordHash: await hashPassword(password),
  });

  //* Create free subscription for new user.
  await createFreeSubscription(user._id);

  //* Invalidate any prior unused OTPs and create a fresh one.
  await EmailVerification.updateMany({ user: user._id, used: false }, { used: true });
  const otp = generateOtp();
  await EmailVerification.create({
    user: user._id,
    token: otp,
    expiresAt: new Date(Date.now() + fifteenMinutes),
  });

  //* Sending OTP verification email.
  const mailResult = await sendEmail({
    to: user.email,
    subject: "Your verification code - CollabSpace",
    html: verifyOtpTemplate({ name: user.fullName, otp }),
  });

  return {
    id: user._id,
    email: user.email,
    verificationEmailSent: !mailResult?.skipped,
    ...(process.env.NODE_ENV === "development" && mailResult?.error
      ? { verificationEmailError: mailResult.error }
      : {}),
  };
};

//* Service function to verify user's email via OTP.
export const verifyOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user)
    throw Object.assign(new Error("Invalid OTP"), { statusCode: 400 });
  if (user.isEmailVerified)
    throw Object.assign(new Error("Email is already verified"), { statusCode: 400 });

  const rec = await EmailVerification.findOne({ user: user._id, token: String(otp), used: false });
  if (!rec)
    throw Object.assign(new Error("Invalid OTP"), { statusCode: 400 });
  if (rec.expiresAt < new Date())
    throw Object.assign(new Error("OTP has expired. Please request a new one."), { statusCode: 400 });

  await User.updateOne({ _id: rec.user }, { isEmailVerified: true });
  rec.used = true;
  await rec.save();

  return { verified: true };
};

//* Service function to resend email verification OTP.
export const resendOtp = async ({ email }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) return { sent: true }; // don't leak account existence
  if (user.isEmailVerified)
    throw Object.assign(new Error("Email is already verified"), { statusCode: 400 });

  //* Invalidate existing unused OTPs.
  await EmailVerification.updateMany({ user: user._id, used: false }, { used: true });

  const otp = generateOtp();
  await EmailVerification.create({
    user: user._id,
    token: otp,
    expiresAt: new Date(Date.now() + fifteenMinutes),
  });

  await sendEmail({
    to: user.email,
    subject: "Your new verification code - CollabSpace",
    html: verifyOtpTemplate({ name: user.fullName, otp }),
  });

  return { sent: true };
};

//* Legacy token-based verify (kept for backward-compat, unused by new UI).
export const verifyEmail = async ({ token }) => {
  const rec = await EmailVerification.findOne({ token, used: false });
  if (!rec)
    throw Object.assign(new Error("Invalid token"), { statusCode: 400 });
  if (rec.expiresAt < new Date())
    throw Object.assign(new Error("Token expired"), { statusCode: 400 });

  await User.updateOne({ _id: rec.user }, { isEmailVerified: true });
  rec.used = true;
  await rec.save();

  return { verified: true };
};

//* Service function to log in a user.
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user)
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  //* Google-only accounts have no password; direct them to use Google sign-in.
  if (!user.passwordHash)
    throw Object.assign(
      new Error("This account was created with Google. Please sign in with Google."),
      { statusCode: 401 },
    );

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok)
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  const token = signAccessToken({ id: user._id, role: user.role });
  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || "",
      isEmailVerified: user.isEmailVerified,
    },
  };
};

//* Service function to handle forgot password requests.
export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) return { sent: true };

  const token = generateToken(32);
  await ResetPassword.create({
    user: user._id,
    token,
    expiresAt: new Date(Date.now() + oneHour),
  });

  //* Sending reset password email.
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password - CollabSpace",
    html: resetPasswordTemplate({ resetUrl }),
  });

  return { sent: true };
};

//* Service function to reset user's password.
export const resetPassword = async ({ token, newPassword }) => {
  const rec = await ResetPassword.findOne({ token, used: false });
  if (!rec)
    throw Object.assign(new Error("Invalid token"), { statusCode: 400 });
  if (rec.expiresAt < new Date())
    throw Object.assign(new Error("Token expired"), { statusCode: 400 });

  await User.updateOne(
    { _id: rec.user },
    { passwordHash: await hashPassword(newPassword) },
  );
  rec.used = true;
  await rec.save();

  return { reset: true };
};

//* Service function to handle Google OAuth — find or create user from Google profile.
export const googleAuth = async ({ code }) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !BACKEND_URL) {
    throw Object.assign(new Error("Google OAuth is not configured"), { statusCode: 500 });
  }

  //* Exchange authorization code for access token.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BACKEND_URL}/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw Object.assign(new Error("Failed to obtain access token from Google"), { statusCode: 400 });
  }

  //* Fetch Google user profile.
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const googleUser = await profileRes.json();

  if (!googleUser.email) {
    throw Object.assign(new Error("Could not retrieve email from Google"), { statusCode: 400 });
  }

  //* Find existing user or create a new one.
  let user = await User.findOne({ email: googleUser.email });

  if (!user) {
    user = await User.create({
      fullName: googleUser.name || googleUser.email,
      email: googleUser.email,
      passwordHash: null,
      googleId: googleUser.id,
      isEmailVerified: true,
      avatarUrl: googleUser.picture || "",
    });
    await createFreeSubscription(user._id);
  } else {
    //* Update Google ID and verify email if not already set.
    const updates = {};
    if (!user.googleId) updates.googleId = googleUser.id;
    if (!user.isEmailVerified) updates.isEmailVerified = true;
    if (!user.avatarUrl && googleUser.picture) updates.avatarUrl = googleUser.picture;
    if (Object.keys(updates).length) {
      await User.updateOne({ _id: user._id }, updates);
    }
  }

  const jwtToken = signAccessToken({ id: user._id, role: user.role });
  return {
    token: jwtToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
      avatarUrl: user.avatarUrl || googleUser.picture || "",
    },
  };
};
