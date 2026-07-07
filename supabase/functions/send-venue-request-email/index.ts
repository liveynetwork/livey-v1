// Setup type definitions for built-in Supabase Runtime APIs

type VenueRequestEmailPayload = {
  venueName: string;
  category: string;
  city: string;
  area: string | null;
  address: string;
  googleMapsUrl: string | null;

  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  bestContactMethod: string | null;

  latitude: number | null;
  longitude: number | null;
  locationSource: string | null;
  locationResolutionError: string | null;

  openingHours: string | null;
  openStatus: string | null;

  firstEventTitle: string | null;
  firstEventDescription: string | null;
  firstEventStatus: string | null;
  firstEventDisplayTime: string | null;
  firstEventStartsAt: string | null;
  firstEventEndsAt: string | null;
};

type ResendEmailResponse = {
  id?: string;
  message?: string;
  name?: string;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LIVEY_VENUE_EMAIL =
  Deno.env.get("LIVEY_VENUE_EMAIL") ?? "venues@livey.network";
const LIVEY_SUPPORT_EMAIL =
  Deno.env.get("LIVEY_SUPPORT_EMAIL") ?? "support@livey.network";
const LIVEY_FROM_EMAIL =
  Deno.env.get("LIVEY_FROM_EMAIL") ?? "venues@livey.network";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned.length > 0 ? cleaned : null;
}

function cleanOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return escapeHtml(String(value));
}

function formatLocationStatus(payload: VenueRequestEmailPayload) {
  if (payload.latitude !== null && payload.longitude !== null) {
    return `Detected (${payload.latitude}, ${payload.longitude})`;
  }

  return payload.locationResolutionError ?? "Manual verification required";
}

function buildVenueConfirmationHtml(payload: VenueRequestEmailPayload) {
  return `
    <div style="margin:0;padding:0;background:#2b2926;color:#e8e2da;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;padding:40px 22px;">
        <div style="border:1px solid rgba(232,226,218,0.14);border-radius:28px;background:rgba(232,226,218,0.07);padding:32px 28px;text-align:center;">
          <img src="https://zocjbpddqeyzausehffs.supabase.co/storage/v1/object/public/public-assets/livey-logo.png" alt="Livey" style="width:96px;height:96px;object-fit:contain;margin:0 auto 12px;display:block;" />

          <p style="margin:0 0 18px;color:#ff5b32;font-size:12px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;text-align:center;">
            Livey for venues
          </p>

          <h1 style="margin:0 auto 18px;max-width:500px;color:#e8e2da;font-size:34px;line-height:1.03;letter-spacing:-0.05em;text-align:center;font-weight:900;">
            Thank you for submitting your venue.
          </h1>

          <p style="margin:0 auto 24px;max-width:450px;color:rgba(232,226,218,0.76);font-size:15px;line-height:1.6;text-align:center;font-weight:500;">
            We received your request for <strong style="color:#e8e2da;font-weight:800;">${escapeHtml(
              payload.venueName
            )}</strong>. Our team will review the venue details and verify the location before it appears on Livey.
          </p>

          <div style="margin:24px auto 18px;padding:22px 18px;border-radius:22px;background:rgba(255,91,50,0.12);border:1px solid rgba(255,91,50,0.24);text-align:center;max-width:500px;">
            <p style="margin:0 0 16px;color:#e8e2da;font-size:15px;font-weight:900;text-align:center;">
              What happens next?
            </p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 auto;text-align:center;">
              <tr>
                <td style="padding:3px 0;color:rgba(232,226,218,0.76);font-size:14px;line-height:1.5;font-weight:600;text-align:center;">
                  1. Livey reviews your venue request.
                </td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:rgba(232,226,218,0.76);font-size:14px;line-height:1.5;font-weight:600;text-align:center;">
                  2. We verify your location, contact details, Instagram, and website.
                </td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:rgba(232,226,218,0.76);font-size:14px;line-height:1.5;font-weight:600;text-align:center;">
                  3. If approved, your venue can appear on the Livey map.
                </td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:rgba(232,226,218,0.76);font-size:14px;line-height:1.5;font-weight:600;text-align:center;">
                  4. You will receive a private Livey venue code.
                </td>
              </tr>
            </table>
          </div>

          <p style="margin:0 auto;max-width:460px;color:rgba(232,226,218,0.6);font-size:13px;line-height:1.6;text-align:center;font-weight:600;">
            If we need anything else, we will contact you using the details you provided.
            Need help? Contact us at
            <a href="mailto:${LIVEY_SUPPORT_EMAIL}" style="color:#ff5b32;text-decoration:none;font-weight:900;">
              ${LIVEY_SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildInternalNotificationHtml(payload: VenueRequestEmailPayload) {
  return `
    <div style="margin:0;padding:0;background:#f7f4ef;color:#2b2926;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="max-width:720px;margin:0 auto;padding:34px 22px;">
        <div style="border:1px solid rgba(43,41,38,0.12);border-radius:24px;background:#ffffff;padding:26px;">
          <p style="margin:0 0 10px;color:#ff5b32;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
            New Livey venue request
          </p>

          <h1 style="margin:0 0 20px;color:#2b2926;font-size:30px;line-height:1;letter-spacing:-0.04em;">
            ${escapeHtml(payload.venueName)}
          </h1>

          <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5;">
            <tbody>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Category</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.category
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">City / Area</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  `${payload.city}${payload.area ? ` / ${payload.area}` : ""}`
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Address</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.address
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Google Maps</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${
                  payload.googleMapsUrl
                    ? `<a href="${escapeHtml(
                        payload.googleMapsUrl
                      )}" style="color:#ff5b32;">Open link</a>`
                    : "Not provided"
                }</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Location status</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${escapeHtml(
                  formatLocationStatus(payload)
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Contact person</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.contactName
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Contact email</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">
                  <a href="mailto:${escapeHtml(
                    payload.contactEmail
                  )}" style="color:#ff5b32;">${escapeHtml(
                    payload.contactEmail
                  )}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Phone</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.contactPhone
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Instagram</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.instagramUrl
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Website</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.websiteUrl
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Best contact method</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.bestContactMethod
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Opening hours</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.openingHours
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">Current status</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.openStatus
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #eee;color:#777;">First activity</td>
                <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:700;">${formatValue(
                  payload.firstEventTitle
                )}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;color:#777;">Activity time</td>
                <td style="padding:9px 0;font-weight:700;">${formatValue(
                  payload.firstEventDisplayTime
                )}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin:22px 0 0;color:#777;font-size:13px;line-height:1.5;">
            Review this request in Supabase before approving it for the Livey map.
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY secret.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Livey <${LIVEY_FROM_EMAIL}>`,
      to,
      subject,
      html,
      reply_to: LIVEY_SUPPORT_EMAIL,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | ResendEmailResponse
    | null;

  if (!response.ok) {
    console.error("Resend email failed:", data);

    throw new Error(data?.message ?? "Could not send email.");
  }

  return data;
}

function parsePayload(body: Record<string, unknown>): VenueRequestEmailPayload {
  return {
    venueName: cleanText(body.venueName),
    category: cleanText(body.category),
    city: cleanText(body.city),
    area: cleanOptionalText(body.area),
    address: cleanText(body.address),
    googleMapsUrl: cleanOptionalText(body.googleMapsUrl),

    contactName: cleanText(body.contactName),
    contactEmail: cleanText(body.contactEmail).toLowerCase(),
    contactPhone: cleanOptionalText(body.contactPhone),
    instagramUrl: cleanOptionalText(body.instagramUrl),
    websiteUrl: cleanOptionalText(body.websiteUrl),
    bestContactMethod: cleanOptionalText(body.bestContactMethod),

    latitude: cleanOptionalNumber(body.latitude),
    longitude: cleanOptionalNumber(body.longitude),
    locationSource: cleanOptionalText(body.locationSource),
    locationResolutionError: cleanOptionalText(body.locationResolutionError),

    openingHours: cleanOptionalText(body.openingHours),
    openStatus: cleanOptionalText(body.openStatus),

    firstEventTitle: cleanOptionalText(body.firstEventTitle),
    firstEventDescription: cleanOptionalText(body.firstEventDescription),
    firstEventStatus: cleanOptionalText(body.firstEventStatus),
    firstEventDisplayTime: cleanOptionalText(body.firstEventDisplayTime),
    firstEventStartsAt: cleanOptionalText(body.firstEventStartsAt),
    firstEventEndsAt: cleanOptionalText(body.firstEventEndsAt),
  };
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed.",
        },
        405
      );
    }

    try {
      const body = (await req.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (!body) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid request body.",
          },
          400
        );
      }

      const payload = parsePayload(body);

      if (!payload.venueName) {
        return jsonResponse(
          {
            success: false,
            error: "Venue name is required.",
          },
          400
        );
      }

      if (!payload.contactEmail) {
        return jsonResponse(
          {
            success: false,
            error: "Contact email is required.",
          },
          400
        );
      }

      const venueEmail = await sendEmail({
        to: payload.contactEmail,
        subject: `Livey received your venue request: ${payload.venueName}`,
        html: buildVenueConfirmationHtml(payload),
      });

      const internalEmail = await sendEmail({
        to: LIVEY_VENUE_EMAIL,
        subject: `New Livey venue request: ${payload.venueName}`,
        html: buildInternalNotificationHtml(payload),
      });

      return jsonResponse({
        success: true,
        venueEmailId: venueEmail?.id ?? null,
        internalEmailId: internalEmail?.id ?? null,
      });
    } catch (error) {
      console.error("Failed to send venue request emails:", error);

      return jsonResponse(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not send venue request emails.",
        },
        500
      );
    }
  },
};