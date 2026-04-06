//* Supports @email mentions. You can extend to @username later.
export const extractMentionEmails = (text = "") => {
  const regex = /@([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  const emails = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    emails.push(match[1].toLowerCase());
  }
  return [...new Set(emails)];
};
