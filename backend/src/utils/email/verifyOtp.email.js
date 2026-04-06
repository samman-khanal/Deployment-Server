//* Self-contained OTP email template — does NOT pass HTML through escapeHtml.
export const verifyOtpTemplate = ({ name, otp }) => {
  const safeName = String(name || "there").replace(/[<>&"']/g, "");
  const digits = String(otp).split("");
  const year = new Date().getFullYear();

  const digitCells = digits
    .map(
      (d) =>
        `<td style="padding:0 4px;">
          <div style="
            width:42px;height:52px;line-height:52px;
            text-align:center;font-size:28px;font-weight:700;
            color:#1d4ed8;background:#eff6ff;
            border:2px solid #bfdbfe;border-radius:10px;
            font-family:'Courier New',Courier,monospace;
          ">${d}</div>
        </td>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Verify Your Email - CollabSpace</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your CollabSpace verification code is inside.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f6;padding:40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d1d5db;box-shadow:0 16px 34px rgba(15,23,42,0.08);">

          <!-- Top accent bar -->
          <tr><td style="height:8px;background:#1d4ed8;"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 34px 24px;background:#111827;border-bottom:1px solid #0a101c;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:34px;height:34px;border-radius:8px;background:#1f2937;border:1px solid #334155;color:#dbeafe;text-align:center;font-size:13px;font-weight:700;line-height:34px;">CS</td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#bfdbfe;font-weight:700;">CollabSpace</div>
                          <div style="margin-top:2px;font-size:11px;color:#94a3b8;font-weight:500;">Secure Notification</div>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top:16px;font-size:30px;line-height:1.2;color:#ffffff;font-weight:700;">Verify Your Email</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sub-header banner -->
          <tr>
            <td style="padding:10px 34px;background:#eff6ff;border-bottom:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#1e40af;letter-spacing:0.03em;text-transform:uppercase;font-weight:700;">Transactional message from CollabSpace</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 30px;">
              <p style="margin:0;font-size:17px;color:#111827;font-weight:500;">Hi ${safeName},</p>
              <p style="margin:14px 0 0;font-size:15px;color:#374151;line-height:1.75;">
                Use the 6-digit code below to verify your email address. This code expires in <strong>15 minutes</strong>.
              </p>

              <!-- OTP digit boxes -->
              <div style="margin:30px 0 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>${digitCells}</tr>
                </table>
              </div>
              <p style="margin:16px 0 0;text-align:center;font-size:13px;color:#64748b;">
                Do not share this code with anyone.
              </p>

              <p style="margin:28px 0 0;font-size:14px;color:#374151;line-height:1.75;">
                If you did not create a CollabSpace account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;">
                This is an automated email from CollabSpace. Please do not reply directly to this message.
              </p>
              <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;">
                © ${year} CollabSpace. All rights reserved.
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
