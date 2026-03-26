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

function buildEmailHtml(p: BuildEmailHtmlParams): string {
  const statusColors: Record<
    string,
    { bg: string; color: string; border: string }
  > = {
    investigating: { bg: "#fff3e0", color: "#e65100", border: "#fb8c00" },
    identified: { bg: "#fff3e0", color: "#e65100", border: "#fb8c00" },
    monitoring: { bg: "#e8f5ee", color: "#1a7a4a", border: "#1a7a4a" },
    resolved: { bg: "#e8f5ee", color: "#1a7a4a", border: "#1a7a4a" },
  };

  const sc = statusColors[p.incidentStatus] ?? statusColors.investigating;
  const statusText =
    p.incidentStatus.charAt(0).toUpperCase() + p.incidentStatus.slice(1);

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
            <td style="background:#1a1714;padding:18px 32px;">
              <a href="${p.pageUrl}" style="color:#f5f2eb;font-size:0.9rem;text-decoration:none;font-weight:700;letter-spacing:-0.02em;">
                ${p.pageName}
              </a>
              <span style="color:#c4bfb4;font-size:0.8rem;margin-left:8px;">Status Update</span>            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 24px;">

              <!-- Status badge -->
              <div style="margin-bottom:14px;">
                <span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;background:${sc.bg};color:${sc.color};border:1.5px solid ${sc.border};">
                  ${statusText}
                </span>
              </div>

              <!-- Title -->
              <h1 style="margin:0 0 0px;font-size:1.3rem;color:#1a1714;line-height:1.3;font-weight:800;letter-spacing:-0.02em;">
                ${p.incidentTitle}
              </h1>

              <!-- Message -->
              <p style="margin:0 0 28px;font-size:0.9rem;color:#3d3530;line-height:1.7;white-space:pre-line;">
                ${p.incidentMessage}
              </p>

              <!-- CTA -->
              <a href="${p.pageUrl}"
                style="display:inline-block;width:auto;background:#1a1714;color:#f5f2eb;padding:11px 22px;
                border-radius:4px;font-size:0.85rem;text-decoration:none;font-weight:600;letter-spacing:-0.01em;">
                View Status Page →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e8e2d9;padding:14px 32px;">
              <p style="margin:0;font-size:0.75rem;color:#8a8070;line-height:1.6;">
                You're receiving this because you subscribed to updates from
                <a href="${p.pageUrl}" style="color:#e8500a;text-decoration:none;font-weight:600;">${p.pageName}</a>.
                &nbsp;·&nbsp;
                <a href="${p.unsubscribeUrl}" style="color:#8a8070;text-decoration:underline;">Unsubscribe</a>
              </p>
              <!-- Statsy branding — TODO (Chat 08): hide for Pro plan users -->
              <p style="margin:8px 0 0;font-size:0.72rem;color:#c4bfb4;">
                Powered by
                <a href="https://statsy.page" style="color:#e8500a;text-decoration:none;font-weight:600;">Statsy</a>
                — status pages for everyone
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
