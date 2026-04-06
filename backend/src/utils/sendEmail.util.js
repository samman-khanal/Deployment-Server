import { getResendClient } from "../config/mail.config.js";

export const sendEmail = async ({ to, subject, html }) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "Mail not configured (missing RESEND_API_KEY). Skipping email send.",
    );
    return { skipped: true };
  }

  try {
    const from =
      process.env.MAIL_FROM || "CollabSpace <no-reply@samman-khanal.me>";

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.warn("Email send failed:", error?.message || error);
      return { skipped: true, error: error?.message || String(error) };
    }

    return data;
  } catch (err) {
    console.warn("Email send failed:", err?.message || err);
    return { skipped: true, error: err?.message || String(err) };
  }
};
