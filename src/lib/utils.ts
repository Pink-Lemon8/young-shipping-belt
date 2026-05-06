import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string) {
  str = str.replace(/^\s+|\s+$/g, "");
  str = str.toLowerCase();
  str = str
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return str;
}

export function formatDate(
  date: Date,
  timezone: string = "UTC",
  format: string = "dd MMM yyyy, hh:mm a"
) {
  return formatInTimeZone(date, timezone, format);
}

export function measurementString(unit: string) {
  if (unit === "CM") {
    return "cm";
  }
  if (unit === "MM") {
    return "mm";
  }
  if (unit === "IN") {
    return "inches";
  }
  return "inches";
}

export function base64ToBlob(
  base64Data: string,
  contentType: string = "",
  sliceSize: number = 512
) {
  // Decode the Base64 string
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  // Process data in slices to manage performance for large files
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  // Create and return a new Blob object
  return new Blob(byteArrays, { type: contentType });
}

export function formatPhoneNumber(input: string): string {
  // Handle empty or N/A case
  if (!input || input === "N/A") return "N/A";

  // Remove all non-digit characters
  const cleaned = input.replace(/\D/g, "");

  // Return empty if no digits
  if (!cleaned.length) return "";

  // Format based on number of digits
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
}

export function onlyNumbers(str: string) {
  return str.replace(/[^0-9]/g, "");
}
