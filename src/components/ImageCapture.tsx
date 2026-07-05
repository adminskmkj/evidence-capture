import { useEffect, useRef, useState } from 'react';
import { getCameraStream, type CameraStream } from '../media/camera';
import { compressImageFromVideo, MAX_IMAGE_BYTES } from '../media/imageCompression';

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
}

interface ImageCaptureProps {
  onCapture: (image: CapturedImage) => void;
  onRetake: () => void;
}

export function ImageCapture({ onCapture, onRetake }: ImageCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<CameraStream | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'captured' | 'error'>('loading');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<CapturedImage | null>(null);
  const [sizeWarning, setSizeWarning] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const cam = await getCameraStream();
        if (cancelled) return cam.stop();

        streamRef.current = cam;

        const video = videoRef.current;
        if (!video) return cam.stop();

        video.srcObject = cam.stream;
        await video.play();
        if (!cancelled) setState('ready');
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Tidak dapat akses kamera');
          setState('error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.stop();
    };
  }, []);

  async function handleCapture() {
    const video = videoRef.current;
    if (!video || state !== 'ready') return;

    try {
      const result = await compressImageFromVideo(video);
      const captured: CapturedImage = {
        blob: result.blob,
        dataUrl: result.dataUrl,
        sizeBytes: result.sizeBytes,
      };

      setPreview(captured);
      setState('captured');

      if (result.sizeBytes > MAX_IMAGE_BYTES) {
        setSizeWarning(
          `Saiz ${(result.sizeBytes / 1024).toFixed(0)}KB melebihi had 500KB. Cuba lagi dengan cahaya lebih terang.`,
        );
        streamRef.current?.stop();
        return;
      }

      setSizeWarning('');
      streamRef.current?.stop();
      onCapture(captured);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal compress gambar');
      setState('error');
    }
  }

  function handleRetake() {
    setState('loading');
    setPreview(null);
    setSizeWarning('');
    onRetake();
  }

  if (state === 'error') {
    return (
      <div className="capture-panel">
        <p className="capture-error">{error || 'Ralat kamera'}</p>
        <button className="primary-action" onClick={handleRetake} type="button">
          Cuba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="capture-panel">
      {state === 'captured' && preview ? (
        <>
          <img alt="Preview gambar" className="capture-preview" src={preview.dataUrl} />
          <div className="capture-info">
            <span>{preview.sizeBytes > MAX_IMAGE_BYTES ? '⚠️' : '✅'}</span>
            <strong>{(preview.sizeBytes / 1024).toFixed(0)} KB</strong>
          </div>
          {sizeWarning && <p className="capture-warning">{sizeWarning}</p>}
          <button className="primary-action" onClick={handleRetake} type="button">
            Ambil Semula
          </button>
        </>
      ) : (
        <>
          <video
            autoPlay
            className="capture-feed"
            muted
            playsInline
            ref={videoRef}
          />
          {state === 'loading' && <p className="capture-loading">Membuka kamera...</p>}
          <button
            className="primary-action"
            disabled={state !== 'ready'}
            onClick={handleCapture}
            type="button"
          >
            📷 Snap Gambar
          </button>
        </>
      )}
    </div>
  );
}
