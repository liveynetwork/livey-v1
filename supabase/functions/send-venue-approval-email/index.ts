import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ApprovalEmailPayload = {
  request_id?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-livey-secret",
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatFromEmail(value: string | null | undefined) {
  const cleanValue = String(value || "venues@livey.network").trim();

  if (cleanValue.includes("<") && cleanValue.includes(">")) {
    return cleanValue;
  }

  return `Livey <${cleanValue}>`;
}

async function sendResendEmail({
  resendApiKey,
  from,
  to,
  subject,
  html,
  text,
}: {
  resendApiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  const emailResult = await emailResponse.json();

  if (!emailResponse.ok) {
    console.error("Resend email error:", emailResult);
    throw new Error(
      emailResult?.message || emailResult?.error || "Failed to send email.",
    );
  }

  return emailResult;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get("LIVEY_APPROVAL_EMAIL_SECRET");
    const receivedSecret = req.headers.get("x-livey-secret");

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Unauthorized approval email request.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const payload = (await req.json()) as ApprovalEmailPayload;
    const requestId = payload.request_id;

    if (!requestId) {
      throw new Error("Missing request_id.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const fromEmail = formatFromEmail(Deno.env.get("LIVEY_FROM_EMAIL"));
    const internalVenueEmail =
      Deno.env.get("LIVEY_VENUE_EMAIL") || "venues@livey.network";
    const supportEmail =
      Deno.env.get("LIVEY_SUPPORT_EMAIL") || "support@livey.network";

    const dashboardUrl =
      Deno.env.get("LIVEY_DASHBOARD_URL") || "XXX/venue-dashboard";

    const logoUrl =
      Deno.env.get("LIVEY_LOGO_URL") ||
      "https://zocjbpddqeyzausehffs.supabase.co/storage/v1/object/public/public-assets/livey-logo.png";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase service configuration.");
    }

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: venueRequest, error: requestError } = await supabase
      .from("venue_requests")
      .select(
        `
        id,
        venue_name,
        category,
        area,
        city,
        address,
        contact_name,
        contact_email,
        contact_phone,
        instagram_url,
        website_url,
        status,
        approved_venue_id,
        created_at
      `,
      )
      .eq("id", requestId)
      .single();

    if (requestError || !venueRequest) {
      throw new Error(requestError?.message || "Venue request not found.");
    }

    if (venueRequest.status !== "approved") {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "Venue request is not approved.",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!venueRequest.contact_email) {
      throw new Error("Venue request has no contact_email.");
    }

    if (!venueRequest.approved_venue_id) {
      throw new Error("Venue request has no approved_venue_id.");
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select(
        `
        id,
        name,
        category,
        area,
        city,
        address,
        description,
        latitude,
        longitude,
        venue_claim_code
      `,
      )
      .eq("id", venueRequest.approved_venue_id)
      .single();

    if (venueError || !venue) {
      throw new Error(venueError?.message || "Approved venue not found.");
    }

    if (!venue.venue_claim_code) {
      throw new Error("Approved venue has no venue_claim_code.");
    }

    const safeVenueName = escapeHtml(venue.name || venueRequest.venue_name);
    const safeContactName = escapeHtml(venueRequest.contact_name || "there");
    const safeClaimCode = escapeHtml(venue.venue_claim_code);
    const safeDashboardUrl = escapeHtml(dashboardUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeLogoUrl = escapeHtml(logoUrl);

    const ownerHtml = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4eee7;font-family:Inter,Arial,sans-serif;color:#2b2926;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4eee7;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid rgba(43,41,38,0.08);box-shadow:0 24px 60px rgba(43,41,38,0.12);">
            <tr>
              <td align="center" style="padding:34px 28px 18px;">
                <img src="${safeLogoUrl}" alt="Livey" width="96" style="display:block;width:96px;height:auto;margin:0 auto 24px;" />
                <h1 style="margin:0;font-size:34px;line-height:0.98;letter-spacing:-1.8px;color:#2b2926;font-weight:900;">
                  Your venue is approved.
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 10px;text-align:center;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:rgba(43,41,38,0.72);font-weight:700;">
                  Hi ${safeContactName}, your venue <strong style="color:#2b2926;">${safeVenueName}</strong> has been approved on Livey.
                </p>

                <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:rgba(43,41,38,0.72);font-weight:700;">
                  You can now create your Livey venue dashboard account and connect it to your approved venue.
                </p>

                <div style="margin:24px 0;padding:20px;border-radius:22px;background:#2b2926;text-align:center;">
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.3;color:rgba(255,255,255,0.62);font-weight:800;text-transform:uppercase;letter-spacing:0.8px;">
                    Your Livey venue code
                  </p>
                  <p style="margin:0;font-size:25px;line-height:1.1;color:#ff5b32;font-weight:900;letter-spacing:1.2px;">
                    ${safeClaimCode}
                  </p>
                </div>

                <div style="margin:0 0 22px;padding:18px;border-radius:20px;background:#f7f1ea;text-align:center;">
  <p style="margin:0 0 10px;font-size:15px;line-height:1.45;color:#2b2926;font-weight:900;text-align:center;">
    How to access your venue dashboard:
  </p>

  <ol style="margin:0 auto;padding-left:0;color:rgba(43,41,38,0.72);font-size:15px;line-height:1.6;font-weight:700;text-align:center;list-style-position:inside;">
    <li>Go to <strong>${safeDashboardUrl}</strong></li>
    <li>Choose <strong>Approved by Livey? Create account</strong></li>
    <li>Enter your Livey venue code</li>
    <li>Create your email and password</li>
    <li>Start managing your venue activity on Livey</li>
  </ol>
</div>

                <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:rgba(43,41,38,0.54);font-weight:700;">
                  Keep this code private. It connects your account to your approved venue and should only be used by the venue owner or manager.
                </p>

                <div style="text-align:center;margin:28px 0 8px;">
                  <a href="${safeDashboardUrl}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:#ff5b32;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;">
                    Open Livey venue dashboard
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px 30px;text-align:center;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(43,41,38,0.45);font-weight:700;">
                  Need help? Contact us at <a href="mailto:${safeSupportEmail}" style="color:#ff5b32;text-decoration:none;">${safeSupportEmail}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    const ownerText = `
Your venue is approved.

Hi ${venueRequest.contact_name || "there"},

Your venue ${venue.name || venueRequest.venue_name} has been approved on Livey.

Your Livey venue code:
${venue.venue_claim_code}

How to access your venue dashboard:
1. Go to ${dashboardUrl}
2. Choose "Approved by Livey? Create account"
3. Enter your Livey venue code
4. Create your email and password
5. Start managing your venue activity on Livey

Keep this code private. It connects your account to your approved venue.

Need help? Contact ${supportEmail}
`;

    const internalHtml = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4eee7;font-family:Inter,Arial,sans-serif;color:#2b2926;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4eee7;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid rgba(43,41,38,0.08);box-shadow:0 24px 60px rgba(43,41,38,0.12);">
            <tr>
              <td align="center" style="padding:34px 28px 18px;">
                <img src="${safeLogoUrl}" alt="Livey" width="92" style="display:block;width:92px;height:auto;margin:0 auto 22px;" />
                <h1 style="margin:0;font-size:30px;line-height:1;letter-spacing:-1.5px;color:#2b2926;font-weight:900;">
                  ${safeVenueName} is now approved.
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 30px;">
                <div style="margin:22px 0;padding:18px;border-radius:20px;background:#f7f1ea;">
                  <p style="margin:0 0 12px;font-size:15px;line-height:1.45;color:#2b2926;font-weight:900;">
                    Approved venue details
                  </p>

                  <p style="margin:0;color:rgba(43,41,38,0.72);font-size:14px;line-height:1.75;font-weight:700;">
                    <strong>Venue name:</strong> ${escapeHtml(venue.name)}<br />
                    <strong>Category:</strong> ${escapeHtml(venue.category || venueRequest.category)}<br />
                    <strong>City:</strong> ${escapeHtml(venue.city || venueRequest.city)}<br />
                    <strong>Area:</strong> ${escapeHtml(venue.area || venueRequest.area)}<br />
                    <strong>Address:</strong> ${escapeHtml(venue.address || venueRequest.address)}<br />
                    <strong>Contact name:</strong> ${escapeHtml(venueRequest.contact_name)}<br />
                    <strong>Contact email:</strong> ${escapeHtml(venueRequest.contact_email)}<br />
                    <strong>Contact phone:</strong> ${escapeHtml(venueRequest.contact_phone)}<br />
                    <strong>Instagram:</strong> ${escapeHtml(venueRequest.instagram_url)}<br />
                    <strong>Website:</strong> ${escapeHtml(venueRequest.website_url)}<br />
                    <strong>Approved venue ID:</strong> ${escapeHtml(venue.id)}<br />
                    <strong>Request ID:</strong> ${escapeHtml(venueRequest.id)}<br />
                    <strong>Venue claim code:</strong> ${safeClaimCode}<br />
                    <strong>Dashboard URL:</strong> ${safeDashboardUrl}
                  </p>
                </div>

                <p style="margin:0;font-size:14px;line-height:1.5;color:rgba(43,41,38,0.54);font-weight:700;text-align:center;">
                  The approval email was also sent to the venue contact.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    const internalText = `
${venue.name || venueRequest.venue_name} is now approved on Livey.

Approved venue details:

Venue name: ${venue.name}
Category: ${venue.category || venueRequest.category || ""}
City: ${venue.city || venueRequest.city || ""}
Area: ${venue.area || venueRequest.area || ""}
Address: ${venue.address || venueRequest.address || ""}
Contact name: ${venueRequest.contact_name || ""}
Contact email: ${venueRequest.contact_email || ""}
Contact phone: ${venueRequest.contact_phone || ""}
Instagram: ${venueRequest.instagram_url || ""}
Website: ${venueRequest.website_url || ""}
Approved venue ID: ${venue.id}
Request ID: ${venueRequest.id}
Venue claim code: ${venue.venue_claim_code}
Dashboard URL: ${dashboardUrl}

The approval email was also sent to the venue contact.
`;

    const ownerEmailResult = await sendResendEmail({
      resendApiKey,
      from: fromEmail,
      to: [venueRequest.contact_email],
      subject: "Your venue is approved on Livey",
      html: ownerHtml,
      text: ownerText,
    });

    const internalEmailResult = await sendResendEmail({
      resendApiKey,
      from: fromEmail,
      to: [internalVenueEmail],
      subject: `${venue.name || venueRequest.venue_name} is now approved on Livey`,
      html: internalHtml,
      text: internalText,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        owner_email_id: ownerEmailResult.id,
        internal_email_id: internalEmailResult.id,
        venue_id: venue.id,
        request_id: venueRequest.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("send-venue-approval-email error:", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});