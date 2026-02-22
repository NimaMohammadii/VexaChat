export type CropAspect = "square" | "fourFive" | "none";

export type ProcessImageOptions = {
  maxWidth: number;
  quality: number;
  cropAspect: CropAspect;
  mimeType?: "image/webp";
};

const MAX_OUTPUT_SIZE = 5 * 1024 * 1024;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
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

function computeTargetRect(width: number, height: number, cropAspect: CropAspect) {
  if (cropAspect === "none") {
    return { sx: 0, sy: 0, sw: width, sh: height, outWidth: width, outHeight: height };
  }

  const aspect = cropAspect === "square" ? 1 : 4 / 5;
  const sourceAspect = width / height;

  let sw = width;
  let sh = height;
  let sx = 0;
  let sy = 0;

  if (sourceAspect > aspect) {
    sw = Math.floor(height * aspect);
    sx = Math.floor((width - sw) / 2);
  } else {
    sh = Math.floor(width / aspect);
    sy = Math.floor((height - sh) / 2);
  }

  return { sx, sy, sw, sh, outWidth: sw, outHeight: sh };
}

export async function processImageFile(file: File, options: ProcessImageOptions): Promise<File> {
  const image = await loadImageFromFile(file);
  const { sx, sy, sw, sh, outWidth, outHeight } = computeTargetRect(image.width, image.height, options.cropAspect);

  const scaledWidth = Math.min(outWidth, options.maxWidth);
  const scale = scaledWidth / outWidth;
  const scaledHeight = Math.round(outHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, scaledWidth);
  canvas.height = Math.max(1, scaledHeight);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, options.mimeType ?? "image/webp", options.quality);
  });

  if (!blob) {
    throw new Error("Unable to process image.");
  }

  if (blob.size > MAX_OUTPUT_SIZE) {
    throw new Error("Processed image is larger than 5MB.");
  }

  const fileName = `${file.name.replace(/\.[^/.]+$/, "")}.webp`;
  return new File([blob], fileName, { type: "image/webp" });
}

export function previewUrl(file: File) {
  return URL.createObjectURL(file);
}
