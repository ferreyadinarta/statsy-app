import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendIncidentNotificationParams {
  to: string[]; // email
  pageSlug: string;
  pageName: string;
  incidentTitle: string;
  incidentStatus: string;
  incidentMessage: string;
  unsubscribeTokens: Record<string, string>; // email -> token
}

export async function sendIncidentNotification({
  to,
  pageSlug,
  pageName,
  incidentTitle,
  incidentStatus,
  incidentMessage,
  unsubscribeTokens,
}: SendIncidentNotificationParams) {
  const results = await Promise.allSettled(
    to.map((email) => {
      const token = unsubscribeTokens[email];
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?token=${token}`;
      const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${pageSlug}`;

      return resend.emails.send({
        from: `${pageName} Status <notifications@statsy.page>`,
        to: email,
        subject: `[${incidentStatus.toUpperCase()}] ${incidentTitle}`,
        html: buildEmailHtml({
          pageName,
          pageUrl,
          incidentTitle,
          incidentStatus,
          incidentMessage,
          unsubscribeUrl,
        }),
      });
    }),
  );

  // Log failures
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Failed to send email to ${to[i]}:`, result.reason);
    }
  });
}

interface BuildEmailHtmlParams {
  pageName: string;
  pageUrl: string;
  incidentTitle: string;
  incidentStatus: string;
  incidentMessage: string;
  unsubscribeUrl: string;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    investigating: "🔴 Investigating",
    identified: "🟠 Identified",
    monitoring: "🟡 Monitoring",
    resolved: "🟢 Resolved",
  };
  return labels[status] ?? status;
}

function buildEmailHtml(p: BuildEmailHtmlParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f2eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:white;border:1.5px solid #1a1714;border-radius:4px;overflow:hidden;max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1714;padding:20px 32px;">
              <a href="${p.pageUrl}" style="color:#f5f2eb;font-size:0.85rem;text-decoration:none;font-weight:600;">
                ${p.pageName} Status
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 6px;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#8a8070;">
                ${statusLabel(p.incidentStatus)}
              </p>
              <h1 style="margin:0 0 20px;font-size:1.25rem;color:#1a1714;line-height:1.3;">
                ${p.incidentTitle}
              </h1>
              <p style="margin:0 0 28px;font-size:0.9rem;color:#3d3530;line-height:1.7;white-space:pre-line;">
                ${p.incidentMessage}
              </p>
              <a href="${p.pageUrl}"
                style="display:inline-block;background:#1a1714;color:#f5f2eb;padding:10px 20px;
                border-radius:4px;font-size:0.85rem;text-decoration:none;font-weight:500;">
                View Status Page →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e8e2d9;padding:16px 32px;">
              <p style="margin:0;font-size:0.75rem;color:#8a8070;">
                You're receiving this because you subscribed to updates from
                <a href="${p.pageUrl}" style="color:#e8500a;text-decoration:none;">${p.pageName}</a>.
                &nbsp;·&nbsp;
                <a href="${p.unsubscribeUrl}" style="color:#8a8070;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
