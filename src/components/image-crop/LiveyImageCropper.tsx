import { useState } from "react";
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

  async function handleSaveCrop() {
    if (!croppedAreaPixels) return;

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
    <div className="livey-image-cropper-backdrop" role="dialog" aria-modal="true">
      <section className="livey-image-cropper-panel">
        <header className="livey-image-cropper-header">
          <div>
            <p>Livey image editor</p>
            <h2>{title}</h2>
            <span>{description}</span>
          </div>

          <button type="button" onClick={onCancel}>
            Close
          </button>
        </header>

        <div className="livey-image-cropper-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
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

        <div className="livey-image-cropper-controls">
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
        </div>

        <footer className="livey-image-cropper-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>

          <button type="button" onClick={handleSaveCrop} disabled={isSaving}>
            {isSaving ? "Preparing..." : "Use image"}
          </button>
        </footer>
      </section>
    </div>
  );
}