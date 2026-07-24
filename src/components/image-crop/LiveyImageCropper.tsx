import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImageFile } from "../../utils/cropImage";
import "./LiveyImageCropper.css";

type LiveyImageCropperProps = {
  imageSrc: string;
  fileName: string;
  title?: string;
  description?: string;
  onCancel: () => void;
  onSave: (file: File, previewUrl: string) => void;
};

export function LiveyImageCropper({
  imageSrc,
  fileName,
  title = "Crop image",
  description = "Move and zoom the image until it fits perfectly.",
  onCancel,
  onSave,
}: LiveyImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onCancel]);

  async function handleSaveCrop() {
    if (!croppedAreaPixels || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const croppedFile = await getCroppedImageFile({
        imageSrc,
        pixelCrop: croppedAreaPixels,
        fileName,
        outputName: "livey-venue-logo",
        outputSize: 900,
        mimeType: "image/jpeg",
        quality: 0.94,
      });

      const previewUrl = URL.createObjectURL(croppedFile);

      onSave(croppedFile, previewUrl);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="livey-image-cropper-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="livey-image-cropper-title"
      aria-describedby="livey-image-cropper-description"
    >
      <section className="livey-image-cropper-panel">
        <header className="livey-image-cropper-header">
          <div className="livey-image-cropper-heading">
            <p>Livey image editor</p>

            <h2 id="livey-image-cropper-title">{title}</h2>

            <span id="livey-image-cropper-description">
              {description}
            </span>
          </div>

          <button
            className="livey-image-cropper-close"
            type="button"
            aria-label="Close image editor"
            onClick={onCancel}
            disabled={isSaving}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M5 5l10 10M15 5 5 15" />
            </svg>
          </button>
        </header>

        <div className="livey-image-cropper-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.12}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedPixels) =>
              setCroppedAreaPixels(croppedPixels)
            }
          />
        </div>

        <p className="livey-image-cropper-hint">
          Drag to reposition • Scroll or pinch to zoom
        </p>

        <footer className="livey-image-cropper-actions">
          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={isSaving || !croppedAreaPixels}
          >
            {isSaving ? "Preparing..." : "Use image"}
          </button>
        </footer>
      </section>
    </div>
  );
}