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

export async function getCroppedAvatarFile({
  imageSrc,
  pixelCrop,
  fileName,
}: {
  imageSrc: string;
  pixelCrop: PixelCrop;
  fileName: string;
}): Promise<File> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const size = 512;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare avatar crop.");
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not create cropped avatar."));
          return;
        }

        resolve(result);
      },
      "image/jpeg",
      0.92
    );
  });

  const cleanName = fileName.replace(/\.[^/.]+$/, "") || "livey-avatar";

  return new File([blob], `${cleanName}-cropped.jpeg`, {
    type: "image/jpeg",
  });
}