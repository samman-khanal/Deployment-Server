import { Resend } from "resend";

let cachedClient = null;
let cachedApiKey = "";

export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;

  if (!apiKey) return null;

  cachedApiKey = apiKey;
  cachedClient = new Resend(apiKey);
  return cachedClient;
};
