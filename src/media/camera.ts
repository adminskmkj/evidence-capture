export interface CameraStream {
  stream: MediaStream;
  stop: () => void;
}

export async function getCameraStream(): Promise<CameraStream> {
  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
      audio: false,
    });
  } catch {
    // Fallback: some devices/desktop don't support exact
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
  }

  return {
    stream,
    stop: () => stream.getTracks().forEach((t) => t.stop()),
  };
}
