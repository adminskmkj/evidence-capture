export const MAX_VIDEO_SECONDS = 90;
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024;
export const TARGET_VIDEO_BYTES = 8 * 1024 * 1024;

const CODECS = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export interface VideoRecordResult {
  blob: Blob;
  url: string;
  sizeBytes: number;
  durationSeconds: number;
}

export interface VideoRecorderControl {
  start: () => Promise<void>;
  stop: () => Promise<VideoRecordResult>;
  mediaStream: MediaStream;
}

export async function createVideoRecorder(): Promise<VideoRecorderControl> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 15, max: 24 },
    },
    audio: true,
  });

  const mimeType = CODECS.find((codec) => MediaRecorder.isTypeSupported(codec)) ?? CODECS[2];

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 700_000,
    audioBitsPerSecond: 64_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return {
    mediaStream: stream,
    start: () =>
      new Promise<void>((resolve, reject) => {
        try {
          recorder.start(1000);
          resolve();
        } catch (err) {
          reject(err);
        }
      }),
    stop: () =>
      new Promise<VideoRecordResult>((resolve, reject) => {
        const startedAt = Date.now();

        recorder.onstop = () => {
          const durationSeconds = (Date.now() - startedAt) / 1000;
          const blob = new Blob(chunks, { type: recorder.mimeType });
          stream.getTracks().forEach((t) => t.stop());

          resolve({
            blob,
            url: URL.createObjectURL(blob),
            sizeBytes: blob.size,
            durationSeconds: Math.round(durationSeconds),
          });
        };

        recorder.onerror = () => {
          stream.getTracks().forEach((t) => t.stop());
          reject(new Error('MediaRecorder error'));
        };

        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }),
  };
}

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
