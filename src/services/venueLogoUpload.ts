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
  const filePath = `${folder}/${crypto.randomUUID()}.${extension}`;

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