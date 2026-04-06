import { renderEmailTemplate } from "./baseTemplate.emai.js";

//* Utility function to generate the HTML content for an email verification message.
export const verifyEmailTemplate = ({ name, verifyUrl }) =>
  renderEmailTemplate({
    preheader: "Verify your CollabSpace account.",
    greeting: `Hi ${name || "there"},`,
    title: "Verify Your Email",
    intro:
      "Welcome to CollabSpace. Please confirm your email address to activate your account and secure your workspace access.",
    ctaLabel: "Verify Email",
    ctaUrl: verifyUrl,
    outro:
      "If you did not create this account, you can safely ignore this email.",
  });
