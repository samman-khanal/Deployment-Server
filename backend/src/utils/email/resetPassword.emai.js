import { renderEmailTemplate } from "./baseTemplate.emai.js";

//* Utility function to generate the HTML content for a password reset email.
export const resetPasswordTemplate = ({ resetUrl }) =>
  renderEmailTemplate({
    preheader: "Secure your account with a password reset.",
    title: "Reset Your Password",
    intro:
      "We received a request to reset your CollabSpace password. Use the button below to choose a new password.",
    ctaLabel: "Reset Password",
    ctaUrl: resetUrl,
    outro:
      "If you did not request this change, you can ignore this email and your current password will remain unchanged.",
  });
