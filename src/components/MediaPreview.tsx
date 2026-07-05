import type { CapturedImage } from './ImageCapture';
import type { CapturedVideo } from './VideoRecorder';

interface MediaPreviewProps {
  media: { type: 'image'; data: CapturedImage } | { type: 'video'; data: CapturedVideo };
  onSave: () => void;
  onRetake: () => void;
  onDiscard: () => void;
}

export function MediaPreview({ media, onSave, onRetake, onDiscard }: MediaPreviewProps) {
  const sizeLabel =
    media.type === 'image'
      ? `${(media.data.sizeBytes / 1024).toFixed(0)} KB`
      : `${(media.data.sizeBytes / 1024 / 1024).toFixed(1)} MB`;

  const durationLabel =
    media.type === 'video'
      ? `${media.data.durationSeconds}s`
      : null;

  return (
    <div className="capture-panel">
      <div className="form-header">
        <p className="eyebrow">Preview Evidence</p>
        <h2>{media.type === 'image' ? 'Gambar' : 'Video'} sedia untuk disimpan</h2>
      </div>

      {media.type === 'image' ? (
        <img
          alt="Preview gambar"
          className="capture-preview"
          src={media.data.dataUrl}
        />
      ) : (
        <video
          className="capture-preview"
          controls
          preload="metadata"
          src={media.data.url}
        />
      )}

      <div className="capture-info">
        <span>✅</span>
        <strong>{sizeLabel}</strong>
        {durationLabel && (
          <>
            <span>·</span>
            <strong>{durationLabel}</strong>
          </>
        )}
      </div>

      <div className="form-actions">
        <button className="primary-action" onClick={onSave} type="button">
          💾 Simpan Evidence
        </button>
        <button className="form-chip" onClick={onRetake} type="button">
          Ambil Semula
        </button>
        <button className="form-chip" onClick={onDiscard} type="button">
          ✕ Padam
        </button>
      </div>
    </div>
  );
}
