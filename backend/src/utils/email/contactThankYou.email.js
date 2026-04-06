//* Self-contained thank-you email for contact form submissions.
export const contactThankYouTemplate = ({ name, subject }) => {
  const safeName = String(name || "there").replace(/[<>&"']/g, "");
  const safeSubject = String(subject || "your inquiry").replace(/[<>&"']/g, "");
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Thank You for Contacting CollabSpace</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Thank you for reaching out to CollabSpace. We've received your message.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f6;padding:40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d1d5db;box-shadow:0 16px 34px rgba(15,23,42,0.08);">

          <!-- Top accent bar -->
          <tr><td style="height:8px;background:#4f46e5;"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 34px 24px;background:#111827;border-bottom:1px solid #0a101c;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:34px;height:34px;border-radius:8px;background:#1f2937;border:1px solid #334155;color:#dbeafe;text-align:center;font-size:13px;font-weight:700;line-height:34px;">CS</td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#bfdbfe;font-weight:700;">CollabSpace</div>
                          <div style="margin-top:2px;font-size:11px;color:#94a3b8;font-weight:500;">Support Team</div>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top:16px;font-size:28px;line-height:1.2;color:#ffffff;font-weight:700;">Thanks for reaching out, ${safeName}!</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:34px;">
              <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.7;">
                We've received your message regarding <strong style="color:#1d4ed8;">"${safeSubject}"</strong> and our team is already on it.
              </p>
              <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.7;">
                We typically respond within <strong>24 hours</strong> on business days. In the meantime, feel free to browse our Help Center or check out our documentation for quick answers.
              </p>

              <!-- Info box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;margin:24px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">What happens next?</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:22px;color:#4f46e5;font-weight:700;font-size:14px;">1.</td>
                              <td style="font-size:14px;color:#374151;padding-left:6px;">Our support team reviews your message</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:22px;color:#4f46e5;font-weight:700;font-size:14px;">2.</td>
                              <td style="font-size:14px;color:#374151;padding-left:6px;">We'll reach out at this email address</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:22px;color:#4f46e5;font-weight:700;font-size:14px;">3.</td>
                              <td style="font-size:14px;color:#374151;padding-left:6px;">Resolution typically within 24–48 business hours</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                If you have any urgent questions, don't hesitate to call us directly at <strong style="color:#374151;">+977 981-426-5591</strong> during business hours (Mon–Fri, 9 AM–6 PM NPT).
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4f46e5;border-radius:10px;">
                    <a href="https://collabspace.com" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Visit CollabSpace</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 34px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;text-align:center;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">
                &copy; ${year} CollabSpace &mdash; Kathmandu, Nepal
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
