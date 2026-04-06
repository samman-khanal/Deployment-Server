const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeUrl = (value) => escapeHtml(String(value ?? ""));

const BRAND = {
  navy: "#111827",
  navySoft: "#1f2937",
  primary: "#1d4ed8",
  primaryDark: "#1e40af",
  accent: "#0f766e",
  white: "#ffffff",
  text900: "#111827",
  text800: "#1f2937",
  text700: "#374151",
  text500: "#64748b",
  text400: "#94a3b8",
  line300: "#d1d5db",
  line200: "#e2e8f0",
  line100: "#f3f4f6",
  canvas: "#f3f4f6",
  panel: "#f9fafb",
};

const renderSectionRows = (sections = []) =>
  sections
    .filter((section) => section?.value)
    .map(
      (section) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.line200}; width: 144px; font-size: 11px; letter-spacing: 0.04em; color: ${BRAND.text500}; font-weight: 600; vertical-align: top; text-transform: uppercase;">${escapeHtml(section.label)}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.line200}; font-size: 14px; color: ${BRAND.text800}; line-height: 1.65; font-weight: 500;">${escapeHtml(section.value)}</td>
        </tr>
      `,
    )
    .join("");

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

export const renderEmailTemplate = ({
  preheader,
  greeting,
  title,
  intro,
  sections,
  quote,
  ctaLabel,
  ctaUrl,
  outro,
  footerHint,
}) => {
  const safeGreeting = greeting || "Hello there,";
  const safeTitle = title || "Notification";
  const safeIntro = intro || "You have a new update in CollabSpace.";
  const safeOutro = outro || "Thanks for using CollabSpace.";
  const safeFooterHint =
    footerHint ||
    "This is an automated email from CollabSpace. Please do not reply directly to this message.";
  const sectionRows = renderSectionRows(sections);
  const hasCta = Boolean(ctaLabel && ctaUrl);
  const now = new Date();
  const year = now.getFullYear();
  const dateLabel = formatDate(now);

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <title>${escapeHtml(safeTitle)} - CollabSpace</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${BRAND.canvas}; font-family: 'Poppins', 'Segoe UI', Tahoma, Verdana, Arial, sans-serif; color: ${BRAND.text800};">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader || safeIntro)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: ${BRAND.canvas}; padding: 40px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 720px; background: ${BRAND.white}; border-radius: 18px; overflow: hidden; border: 1px solid ${BRAND.line300}; box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);">
            <tr>
              <td style="padding: 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="height: 8px; background: ${BRAND.primary};"></td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 34px 26px 34px; background: ${BRAND.navy}; border-bottom: 1px solid #0a101c;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="left" style="vertical-align: top;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="width: 34px; height: 34px; border-radius: 8px; background: ${BRAND.navySoft}; border: 1px solid #334155; color: #dbeafe; text-align: center; font-size: 14px; font-weight: 700;">CS</td>
                                <td style="padding-left: 10px; vertical-align: middle;">
                                  <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #bfdbfe; font-weight: 700;">CollabSpace</div>
                                  <div style="margin-top: 2px; font-size: 11px; color: #94a3b8; font-weight: 500;">Secure Notification</div>
                                </td>
                              </tr>
                            </table>
                            <div style="margin-top: 16px; font-size: 32px; line-height: 1.22; color: #ffffff; font-weight: 700;">${escapeHtml(safeTitle)}</div>
                          </td>
                          <td align="right" style="vertical-align: top;">
                            <div style="display: inline-block; background: ${BRAND.navySoft}; border: 1px solid #334155; border-radius: 8px; padding: 8px 10px; text-align: right;">
                              <div style="font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; color: #93c5fd; font-weight: 700;">Issued</div>
                              <div style="margin-top: 3px; font-size: 12px; color: #d9e5ff; font-weight: 600;">${dateLabel}</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 11px 34px; background: #eff6ff; border-bottom: 1px solid ${BRAND.line200};">
                      <div style="font-size: 11px; color: ${BRAND.primaryDark}; letter-spacing: 0.03em; text-transform: uppercase; font-weight: 700;">Transactional message from CollabSpace</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 38px 36px 30px 36px;">
                <p style="margin: 0; font-size: 17px; color: ${BRAND.text900}; font-weight: 500;">${escapeHtml(safeGreeting)}</p>
                <p style="margin: 14px 0 0 0; font-size: 16px; color: ${BRAND.text700}; line-height: 1.8;">${escapeHtml(safeIntro)}</p>
                ${
                  sectionRows
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 22px; border-collapse: collapse; background: #ffffff; border: 1px solid ${BRAND.line200}; border-radius: 12px; overflow: hidden;">${sectionRows}</table>`
                    : ""
                }
                ${
                  quote
                    ? `<div style="margin-top: 22px; padding: 16px 18px; background: ${BRAND.panel}; border: 1px solid ${BRAND.line200}; border-left: 4px solid ${BRAND.primary}; border-radius: 12px; color: ${BRAND.text700}; font-size: 14px; line-height: 1.75;">${escapeHtml(quote)}</div>`
                    : ""
                }
                ${
                  hasCta
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 28px;"><tr><td><a href="${escapeUrl(
                        ctaUrl,
                      )}" style="display: inline-block; padding: 14px 26px; border-radius: 8px; text-decoration: none; background: ${BRAND.primary}; color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.01em; border: 1px solid ${BRAND.primaryDark}; box-shadow: 0 6px 14px rgba(29, 78, 216, 0.24);">${escapeHtml(
                        ctaLabel,
                      )} &rarr;</a></td></tr></table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-collapse: separate; border-spacing: 0; border: 1px solid ${BRAND.line200}; border-radius: 10px; overflow: hidden; background: #ffffff;">
                        <tr>
                          <td style="padding: 10px 12px; background: ${BRAND.panel}; border-bottom: 1px solid ${BRAND.line200}; font-size: 11px; color: ${BRAND.text500}; letter-spacing: 0.03em; text-transform: uppercase; font-weight: 700;">Secure Backup Link</td>
                        </tr>
                        <tr>
                          <td style="padding: 11px 12px; font-size: 12px; line-height: 1.65; color: ${BRAND.text700}; word-break: break-all; font-family: Menlo, Consolas, Monaco, monospace;">
                            <a href="${escapeUrl(ctaUrl)}" style="color: ${BRAND.primary}; text-decoration: none;">${escapeUrl(
                              ctaUrl,
                            )}</a>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }
                <p style="margin: 26px 0 0 0; font-size: 14px; color: ${BRAND.text700}; line-height: 1.8;">${escapeHtml(safeOutro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 22px 36px 32px 36px; border-top: 1px solid ${BRAND.line200}; background: #f8fafc;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 12px; color: ${BRAND.text500}; line-height: 1.7;">
                      ${escapeHtml(safeFooterHint)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 10px; font-size: 12px; color: ${BRAND.text400}; line-height: 1.65; border-top: 1px solid ${BRAND.line200};">
                      © ${year} CollabSpace. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};