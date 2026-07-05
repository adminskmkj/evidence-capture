export interface CameraStream {
  stream: MediaStream;
  stop: () => void;
}

export async function getCameraStream(): Promise<CameraStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });

  return {
    stream,
    stop: () => {
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
