import heic2any from "heic2any";
import { convertViaCanvas } from "./convertViaCanvas";
import { toast } from "sonner";

export const CONVERT_TO_JPEG_TYPES = [
    "image/heic",
    "image/heif",
    "image/webp",
];

// Normalizes various image formats to JPEG for better compatibility and compression.
export const normalizeToJpeg = async (file: File): Promise<File> => {
    if (!CONVERT_TO_JPEG_TYPES.includes(file.type) && !!file.type) {
        return file;
    }

    // HEIC / HEIF → use library
    if (file.type === "image/heic" || file.type === "image/heif" || !file.type) {
        const result = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
        });

        const blob = Array.isArray(result) ? result[0] : result;

        toast.success("Image converted to JPEG successfully!");

        return new File([blob as BlobPart], file.name.replace(/\.\w+$/, ".jpg"), {
            type: "image/jpeg",
        });
    }

    return convertViaCanvas(file);
};