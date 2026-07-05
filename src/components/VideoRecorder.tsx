import { useEffect, useRef, useState } from 'react';
import {
  createVideoRecorder,
  formatTime,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  type VideoRecordResult,
  type VideoRecorderControl,
} from '../media/videoRecorder';

export interface CapturedVideo {
  blob: Blob;
  url: string;
  sizeBytes: number;
  durationSeconds: number;
}

interface VideoRecorderProps {
  onCapture: (video: CapturedVideo) => void;
  onRetake: () => void;
}

export function VideoRecorder({ onCapture, onRetake }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<VideoRecorderControl | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<'loading' | 'preview' | 'recording' | 'done' | 'error'>(
    'loading',
  );
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<CapturedVideo | null>(null);
  const [sizeWarning, setSizeWarning] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const recorder = await createVideoRecorder();
        if (cancelled) {
          recorder.mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        recorderRef.current = recorder;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = recorder.mediaStream;
        await video.play();
        if (!cancelled) setState('preview');
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Tidak dapat akses kamera');
          setState('error');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.mediaStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleStart() {
    const recorder = recorderRef.current;
    if (!recorder || state !== 'preview') return;

    setState('recording');
    setElapsed(0);

    await recorder.start();

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= MAX_VIDEO_SECONDS) {
          void handleStop();
        }
        return next;
      });
    }, 1000);
  }

  async function handleStop() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = recorderRef.current;
    if (!recorder || state !== 'recording') return;

    try {
      const result: VideoRecordResult = await recorder.stop();
      const captured: CapturedVideo = {
        blob: result.blob,
        url: result.url,
        sizeBytes: result.sizeBytes,
        durationSeconds: result.durationSeconds,
      };

      setPreview(captured);
      setState('done');

      if (result.sizeBytes > MAX_VIDEO_BYTES) {
        setSizeWarning(
          `Video ${(result.sizeBytes / 1024 / 1024).toFixed(1)}MB melebihi had 10MB. Sila rakam semula.`,
        );
        return;
      }

      onCapture(captured);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan video');
      setState('error');
    }
  }

  function handleRetake() {
    setState('loading');
    setPreview(null);
    setSizeWarning('');
    setElapsed(0);
    onRetake();
    setTimeout(() => setState('preview'), 100);
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

  if (state === 'done' && preview) {
    return (
      <div className="capture-panel">
        <video className="capture-preview" controls src={preview.url} />
        <div className="capture-info">
          <span>{preview.sizeBytes > MAX_VIDEO_BYTES ? '⚠️' : '✅'}</span>
          <strong>{(preview.sizeBytes / 1024 / 1024).toFixed(1)} MB</strong>
          <span>·</span>
          <strong>{preview.durationSeconds}s</strong>
        </div>
        {sizeWarning && <p className="capture-warning">{sizeWarning}</p>}
        <button className="primary-action" onClick={handleRetake} type="button">
          Rakam Semula
        </button>
      </div>
    );
  }

  return (
    <div className="capture-panel">
      <video
        autoPlay
        className="capture-feed"
        muted
        playsInline
        ref={videoRef}
      />

      {state === 'recording' && (
        <div className="recording-indicator">
          <span className="recording-dot" />
          <strong>{formatTime(elapsed)} / {formatTime(MAX_VIDEO_SECONDS)}</strong>
        </div>
      )}

      {state === 'loading' && <p className="capture-loading">Membuka kamera...</p>}

      {state === 'preview' && (
        <button className="primary-action" onClick={handleStart} type="button">
          🎥 Mula Rakam
        </button>
      )}

      {state === 'recording' && (
        <button className="primary-action" onClick={handleStop} type="button">
          ⏹ Berhenti
        </button>
      )}
    </div>
  );
}
