const IMAGE_MAX_DIMENSION = 1080;
const IMAGE_QUALITY = 0.72;
const VIDEO_MAX_DURATION_SECONDS = 12;
export const VIDEO_MAX_SIZE_BYTES = 8 * 1024 * 1024;

export type CompressedChatImage = {
  blob: Blob;
  fileName: string;
  mimeType: string;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };

    image.src = url;
  });
}

function hasTransparency(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(image.width, 256);
  canvas.height = Math.min(image.height, 256);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return false;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      return true;
    }
  }

  return false;
}

export async function compressChatImage(file: File): Promise<CompressedChatImage> {
  const image = await loadImage(file);
  const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const keepPng = file.type === "image/png" && hasTransparency(image);
  const mimeType = keepPng ? "image/png" : "image/jpeg";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, keepPng ? undefined : IMAGE_QUALITY);
  });

  if (!blob) {
    throw new Error("Unable to compress image.");
  }

  const extension = keepPng ? "png" : "jpg";
  const fileName = `${file.name.replace(/\.[^/.]+$/, "")}.${extension}`;
  return {
    blob,
    fileName,
    mimeType
  };
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read video metadata."));
    };

    video.src = url;
  });
}

export async function validateVideo(file: File) {
  if (file.size > VIDEO_MAX_SIZE_BYTES) {
    throw new Error("Video must be 8MB or smaller.");
  }

  const duration = await getVideoDuration(file);
  if (!Number.isFinite(duration) || duration > VIDEO_MAX_DURATION_SECONDS) {
    throw new Error("Video must be 12 seconds or shorter.");
  }
}
