//? Importing necessary modules.
import ContactMessage from "../models/ContactMessage.model.js";
import { sendEmail } from "../utils/sendEmail.util.js";
import { contactThankYouTemplate } from "../utils/email/contactThankYou.email.js";

//* Save contact form submission to the database and send a thank-you email.
export const submitContact = async ({ name, email, subject, message }) => {
  if (!name || !email || !subject || !message) {
    const err = new Error("All fields are required.");
    err.statusCode = 400;
    throw err;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error("Please provide a valid email address.");
    err.statusCode = 400;
    throw err;
  }

  if (message.trim().length < 10) {
    const err = new Error("Message must be at least 10 characters.");
    err.statusCode = 400;
    throw err;
  }

  //* Save to database.
  const contact = await ContactMessage.create({ name, email, subject, message });

  //* Send confirmation email to the user.
  await sendEmail({
    to: email,
    subject: "Thanks for reaching out — CollabSpace Support",
    html: contactThankYouTemplate({ name, subject }),
  });

  return { success: true, id: contact._id };
};
