import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedAvatarFile } from "../utils/cropImage";

type LiveyAvatarCropModalProps = {
  imageSrc: string;
  fileName: string;
  busy: boolean;
  onDiscard: () => void;
  onSave: (file: File) => Promise<void>;
};

export function LiveyAvatarCropModal({
  imageSrc,
  fileName,
  busy,
  onDiscard,
  onSave,
}: LiveyAvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  async function handleSave() {
    if (!croppedAreaPixels || busy) return;

    const croppedFile = await getCroppedAvatarFile({
      imageSrc,
      pixelCrop: croppedAreaPixels,
      fileName,
    });

    await onSave(croppedFile);
  }

  return (
    <div className="livey-avatar-crop-backdrop" role="presentation">
      <section
        className="livey-avatar-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Adjust avatar"
      >
        <div className="livey-avatar-crop-copy">
          <h3>Adjust avatar</h3>
          <p>Move and zoom your photo until it fits the circle.</p>
        </div>

        <div className="livey-avatar-crop-frame">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedPixels) =>
              setCroppedAreaPixels(croppedPixels)
            }
          />
        </div>

        <label className="livey-avatar-crop-zoom">
          <span>Zoom</span>

          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={busy}
          />
        </label>

        <div className="livey-avatar-crop-actions">
          <button type="button" onClick={onDiscard} disabled={busy}>
            Discard
          </button>

          <button type="button" onClick={handleSave} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}