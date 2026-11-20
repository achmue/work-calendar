// Reading and saving files in the browser, plus the rules for uploaded images.

export const MAX_IMAGE_BYTES = 500 * 1024;
export const IMAGE_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** A friendly error if this file can't be used as a background image, else null. */
export function checkImageFile(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Please choose a PNG, JPEG, WebP or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${Math.ceil(file.size / 1024)} KB. Please choose one under ${MAX_IMAGE_BYTES / 1024} KB.`;
  }
  return null;
}

function readFile(read: (reader: FileReader) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    read(reader);
  });
}

export const readFileAsDataURL = (file: Blob): Promise<string> => readFile((r) => r.readAsDataURL(file));
export const readFileAsText = (file: Blob): Promise<string> => readFile((r) => r.readAsText(file));

/** Save text as a file download. */
export function downloadTextFile(filename: string, text: string, mime = "application/json"): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
