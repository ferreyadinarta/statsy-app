import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSignupConfirmationEmail({
  to,
  confirmLink,
}: {
  to: string;
  confirmLink: string;
}) {
  return resend.emails.send({
    from: "Statsy <noreply@statsy.page>",
    to,
    subject: "Confirm your Statsy account",
    html: buildSignupConfirmationEmailHtml(confirmLink),
  });
}

function buildSignupConfirmationEmailHtml(confirmLink: string): string {
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
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:white;border:1.5px solid #1a1714;border-radius:4px;overflow:hidden;max-width:520px;">
          <tr>
            <td style="background:#1a1714;padding:20px 32px;">
              <a href="https://statsy.page" style="text-decoration:none;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e8500a;vertical-align:middle;margin-right:7px;"></span><span style="color:#f5f2eb;font-size:1rem;font-weight:900;letter-spacing:-0.04em;vertical-align:middle;">Statsy</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;">
              <h1 style="margin:0 0 8px;font-size:1.5rem;color:#1a1714;font-weight:900;letter-spacing:-0.04em;line-height:1.2;">
                Confirm your account
              </h1>
              <p style="margin:0 0 28px;font-size:0.9rem;color:#3d3530;line-height:1.7;">
                Welcome to Statsy! Click the button below to activate your account. This link expires in 24 hours.
              </p>
              <a href="${confirmLink}"
                style="display:inline-block;background:#1a1714;color:#f5f2eb;padding:12px 24px;
                border-radius:4px;font-size:0.875rem;text-decoration:none;font-weight:600;letter-spacing:-0.01em;">
                Confirm account →
              </a>
              <p style="margin:24px 0 0;font-size:0.8rem;color:#8a8070;line-height:1.6;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e8e2d9;padding:14px 32px;">
              <p style="margin:0;font-size:0.75rem;color:#8a8070;line-height:1.6;">
                <a href="https://statsy.page" style="color:#e8500a;text-decoration:none;font-weight:600;">Statsy</a>
                &nbsp;·&nbsp; Status pages for everyone
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

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  return resend.emails.send({
    from: "Statsy <noreply@statsy.page>",
    to,
    subject: "Reset your Statsy password",
    html: buildPasswordResetEmailHtml(resetLink),
  });
}

function buildPasswordResetEmailHtml(resetLink: string): string {
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
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:white;border:1.5px solid #1a1714;border-radius:4px;overflow:hidden;max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1714;padding:20px 32px;">
              <a href="https://statsy.page" style="text-decoration:none;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e8500a;vertical-align:middle;margin-right:7px;"></span><span style="color:#f5f2eb;font-size:1rem;font-weight:900;letter-spacing:-0.04em;vertical-align:middle;">Statsy</span>
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 28px;">
              <h1 style="margin:0 0 8px;font-size:1.5rem;color:#1a1714;font-weight:900;letter-spacing:-0.04em;line-height:1.2;">
                Reset your password
              </h1>
              <p style="margin:0 0 28px;font-size:0.9rem;color:#3d3530;line-height:1.7;">
                We received a request to reset the password for your Statsy account.
                Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <a href="${resetLink}"
                style="display:inline-block;background:#1a1714;color:#f5f2eb;padding:12px 24px;
                border-radius:4px;font-size:0.875rem;text-decoration:none;font-weight:600;letter-spacing:-0.01em;">
                Reset Password →
              </a>
              <p style="margin:24px 0 0;font-size:0.8rem;color:#8a8070;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.
                Your password won't change.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e8e2d9;padding:14px 32px;">
              <p style="margin:0;font-size:0.75rem;color:#8a8070;line-height:1.6;">
                <a href="https://statsy.page" style="color:#e8500a;text-decoration:none;font-weight:600;">Statsy</a>
                &nbsp;·&nbsp; Status pages for everyone
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

interface SendIncidentNotificationParams {
  to: string[]; // email
  pageSlug: string;
  pageName: string;
  incidentTitle: string;
  incidentStatus: string;
  incidentMessage: string;
  unsubscribeTokens: Record<string, string>; // email -> token
  isPro: boolean;
}

export async function sendIncidentNotification({
  to,
  pageSlug,
  pageName,
  incidentTitle,
  incidentStatus,
  incidentMessage,
  unsubscribeTokens,
  isPro,
}: SendIncidentNotificationParams) {
  const results = await Promise.allSettled(
    to.map((email) => {
      const token = unsubscribeTokens[email];
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?token=${token}`;
      const pageUrl = `https://${pageSlug}.statsy.page`;

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
          isPro,
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
  isPro: boolean;
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
              ${p.isPro ? "" : `<p style="margin:8px 0 0;font-size:0.72rem;color:#c4bfb4;">
                Powered by
                <a href="https://statsy.page" style="color:#e8500a;text-decoration:none;font-weight:600;">Statsy</a>
                — status pages for everyone
              </p>`}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Monitoring alerts ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  outage:      { bg: "#fdeae8", color: "#d32f2f", border: "#d32f2f", label: "Outage" },
  degraded:    { bg: "rgba(232,80,10,0.08)", color: "#e8500a", border: "#e8500a", label: "Degraded" },
  operational: { bg: "#e8f5ee", color: "#1a7a4a", border: "#1a7a4a", label: "Operational" },
};

function buildMonitoringAlertHtml({
  pageName,
  pageUrl,
  serviceName,
  newStatus,
  unsubscribeUrl,
  isPro,
  isOwner,
}: {
  pageName: string;
  pageUrl: string;
  serviceName: string;
  newStatus: "operational" | "degraded" | "outage";
  unsubscribeUrl?: string;
  isPro: boolean;
  isOwner: boolean;
}): string {
  const sc = STATUS_STYLES[newStatus];
  const isDown = newStatus === "outage" || newStatus === "degraded";
  const headline = isDown
    ? `${serviceName} is ${sc.label.toLowerCase()}`
    : `${serviceName} has recovered`;
  const body = isDown
    ? `Statsy detected that <strong>${serviceName}</strong> on your <strong>${pageName}</strong> status page is reporting <strong>${sc.label}</strong>. Check your service and update your status page accordingly.`
    : `<strong>${serviceName}</strong> on <strong>${pageName}</strong> is back to <strong>Operational</strong>.`;

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
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:white;border:1.5px solid #1a1714;border-radius:4px;overflow:hidden;max-width:520px;">
          <tr>
            <td style="background:#1a1714;padding:20px 32px;">
              <a href="${pageUrl}" style="text-decoration:none;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e8500a;vertical-align:middle;margin-right:7px;"></span><span style="color:#f5f2eb;font-size:1rem;font-weight:900;letter-spacing:-0.04em;vertical-align:middle;">Statsy</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 24px;">
              <div style="margin-bottom:14px;">
                <span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;background:${sc.bg};color:${sc.color};border:1.5px solid ${sc.border};">
                  ${sc.label}
                </span>
              </div>
              <h1 style="margin:0 0 12px;font-size:1.3rem;color:#1a1714;font-weight:900;letter-spacing:-0.03em;line-height:1.2;">
                ${headline}
              </h1>
              <p style="margin:0 0 28px;font-size:0.9rem;color:#3d3530;line-height:1.7;">
                ${body}
              </p>
              <a href="${pageUrl}"
                style="display:inline-block;background:#1a1714;color:#f5f2eb;padding:11px 22px;border-radius:4px;font-size:0.85rem;text-decoration:none;font-weight:600;letter-spacing:-0.01em;">
                View Status Page →
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e8e2d9;padding:14px 32px;">
              <p style="margin:0;font-size:0.75rem;color:#8a8070;line-height:1.6;">
                ${isOwner
                  ? `Automated monitoring alert from <a href="https://statsy.page" style="color:#e8500a;text-decoration:none;font-weight:600;">Statsy</a>.`
                  : `You're receiving this because you subscribed to updates from <a href="${pageUrl}" style="color:#e8500a;text-decoration:none;font-weight:600;">${pageName}</a>.${unsubscribeUrl ? ` &nbsp;·&nbsp; <a href="${unsubscribeUrl}" style="color:#8a8070;text-decoration:underline;">Unsubscribe</a>` : ""}`
                }
              </p>
              ${!isPro ? `<p style="margin:8px 0 0;font-size:0.72rem;color:#c4bfb4;">Powered by <a href="https://statsy.page" style="color:#e8500a;text-decoration:none;font-weight:600;">Statsy</a></p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOwnerStatusAlert({
  to,
  serviceName,
  newStatus,
  pageSlug,
  pageName,
}: {
  to: string;
  serviceName: string;
  newStatus: "operational" | "degraded" | "outage";
  pageSlug: string;
  pageName: string;
}) {
  const pageUrl = `https://${pageSlug}.statsy.page`;
  const sc = STATUS_STYLES[newStatus];
  const subject = newStatus === "operational"
    ? `✓ Recovered: ${serviceName} is back up`
    : `⚠ ${sc.label}: ${serviceName} on ${pageName}`;

  return resend.emails.send({
    from: "Statsy Monitoring <noreply@statsy.page>",
    to,
    subject,
    html: buildMonitoringAlertHtml({ pageName, pageUrl, serviceName, newStatus, isPro: true, isOwner: true }),
  });
}

export async function sendSubscriberStatusChangeAlert({
  subscribers,
  serviceName,
  newStatus,
  pageSlug,
  pageName,
  isPro,
}: {
  subscribers: { email: string; token: string }[];
  serviceName: string;
  newStatus: "operational" | "degraded" | "outage";
  pageSlug: string;
  pageName: string;
  isPro: boolean;
}) {
  const pageUrl = `https://${pageSlug}.statsy.page`;
  const sc = STATUS_STYLES[newStatus];
  const subject = newStatus === "operational"
    ? `✓ Recovered: ${serviceName} is back up — ${pageName}`
    : `⚠ ${sc.label}: ${serviceName} — ${pageName}`;

  const results = await Promise.allSettled(
    subscribers.map(({ email, token }) => {
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?token=${token}`;
      return resend.emails.send({
        from: `${pageName} Status <notifications@statsy.page>`,
        to: email,
        subject,
        html: buildMonitoringAlertHtml({ pageName, pageUrl, serviceName, newStatus, unsubscribeUrl, isPro, isOwner: false }),
      });
    }),
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`Failed to send alert to ${subscribers[i].email}:`, r.reason);
  });
}
