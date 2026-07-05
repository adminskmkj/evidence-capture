export const MAX_IMAGE_BYTES = 500 * 1024;
export const IMAGE_MAX_WIDTH = 1280;
export const IMAGE_MIN_QUALITY = 0.45;
export const IMAGE_FALLBACK_WIDTH = 1024;

interface CompressResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  quality: number;
  sizeBytes: number;
}

export async function compressImageFromVideo(
  video: HTMLVideoElement,
  targetWidth: number = IMAGE_MAX_WIDTH,
): Promise<CompressResult> {
  const naturalW = video.videoWidth;
  const naturalH = video.videoHeight;

  const scale = Math.min(1, targetWidth / naturalW);
  const w = Math.round(naturalW * scale);
  const h = Math.round(naturalH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.drawImage(video, 0, 0, w, h);

  return compressBlobIteratively(canvas, w, h);
}

async function compressBlobIteratively(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
): Promise<CompressResult> {
  const qualities = [0.75, 0.6, 0.5, IMAGE_MIN_QUALITY];

  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, q);
    if (blob.size <= MAX_IMAGE_BYTES) {
      return {
        blob,
        dataUrl: await blobToDataUrl(blob),
        width: w,
        height: h,
        quality: q,
        sizeBytes: blob.size,
      };
    }
  }

  const resizedCanvas = document.createElement('canvas');
  const fallbackScale = IMAGE_FALLBACK_WIDTH / w;
  resizedCanvas.width = Math.round(w * fallbackScale);
  resizedCanvas.height = Math.round(h * fallbackScale);
  const ctx2 = resizedCanvas.getContext('2d');
  if (!ctx2) throw new Error('Canvas 2D context not available');
  ctx2.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

  const finalBlob = await canvasToBlob(resizedCanvas, IMAGE_MIN_QUALITY);
  return {
    blob: finalBlob,
    dataUrl: await blobToDataUrl(finalBlob),
    width: resizedCanvas.width,
    height: resizedCanvas.height,
    quality: IMAGE_MIN_QUALITY,
    sizeBytes: finalBlob.size,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
