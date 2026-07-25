import { supabase } from "../lib/supabase";

const VENUE_LOGO_BUCKET = "venue-logos";
const MAX_LOGO_SIZE_MB = 5;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

const allowedLogoTypes = ["image/png", "image/jpeg", "image/webp"];

type UploadVenueLogoOptions = {
  folder?: "requests" | "dashboard";
};

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "jpg") return "jpeg";
  if (extension === "jpeg") return "jpeg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";

  return "jpeg";
}

function createFallbackUuid() {
  const randomValues = new Uint8Array(16);

  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    globalThis.crypto.getRandomValues(randomValues);

    randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
    randomValues[8] = (randomValues[8] & 0x3f) | 0x80;

    const hex = Array.from(randomValues, (value) =>
      value.toString(16).padStart(2, "0")
    );

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 14);

  return `${timestamp}-${randomPart}`;
}

function createUploadId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return createFallbackUuid();
}

export function validateVenueLogoFile(file: File) {
  if (!allowedLogoTypes.includes(file.type)) {
    throw new Error("Please upload a PNG, JPG, JPEG, or WebP image.");
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error(`Venue logo must be under ${MAX_LOGO_SIZE_MB} MB.`);
  }
}

export async function uploadVenueLogo(
  file: File,
  options: UploadVenueLogoOptions = {}
) {
  validateVenueLogoFile(file);

  const extension = getFileExtension(file);
  const folder = options.folder ?? "requests";
  const uploadId = createUploadId();
  const filePath = `${folder}/${uploadId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(VENUE_LOGO_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Failed to upload venue logo:", uploadError);
    throw new Error("Could not upload venue logo. Please try again.");
  }

  const { data } = supabase.storage
    .from(VENUE_LOGO_BUCKET)
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error("Could not prepare venue logo URL.");
  }

  return data.publicUrl;
}