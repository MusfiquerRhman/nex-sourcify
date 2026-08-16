export const ACCEPTED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
];

// Validates that the file is an accepted image type based on MIME type and extension.
export const isValidImage = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    const allowedExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

    const mimeValid = !file.type || ACCEPTED_TYPES.includes(file.type);

    const extValid = !!ext && allowedExt.includes(ext);

    return mimeValid && extValid;
};

// Checks if the image can be loaded successfully, which helps catch corrupted files.
export const canLoadImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(true);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(false);
        };

        img.src = url;
    });
};