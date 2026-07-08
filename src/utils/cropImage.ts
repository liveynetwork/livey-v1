export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function createImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export async function getCroppedImageFile({
  imageSrc,
  pixelCrop,
  fileName,
  outputName = "livey-image",
  outputSize = 800,
  mimeType = "image/jpeg",
  quality = 0.92,
}: {
  imageSrc: string;
  pixelCrop: PixelCrop;
  fileName: string;
  outputName?: string;
  outputSize?: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
}): Promise<File> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image crop.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not create cropped image."));
          return;
        }

        resolve(result);
      },
      mimeType,
      quality
    );
  });

  const cleanName =
    fileName.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, "-") ||
    outputName;

  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg";

  return new File([blob], `${cleanName}-cropped.${extension}`, {
    type: mimeType,
  });
}

/**
 * Backwards-compatible export so old avatar code does not break.
 */
export async function getCroppedAvatarFile({
  imageSrc,
  pixelCrop,
  fileName,
}: {
  imageSrc: string;
  pixelCrop: PixelCrop;
  fileName: string;
}): Promise<File> {
  return getCroppedImageFile({
    imageSrc,
    pixelCrop,
    fileName,
    outputName: "livey-avatar",
    outputSize: 512,
    mimeType: "image/jpeg",
    quality: 0.92,
  });
}