export const MAX_SIZE_KB = 250;

// Compresses an image file to ensure it's under the specified max size in KB.
const compressImage = (file: File, maxKB: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject();

            let width = img.width;
            let height = img.height;

            // Resize large images first
            const maxDim = 1400;
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.9;

            // Iteratively reduce quality until under max size or quality is too low
            const loop = () => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject();

                        if (blob.size / 1024 <= maxKB || quality <= 0.1) {
                            URL.revokeObjectURL(url);
                            resolve(
                                new File([blob], file.name, { type: "image/jpeg" })
                            );
                        } else {
                            quality -= 0.1;
                            loop();
                        }
                    },
                    "image/jpeg",
                    quality
                );
            };

            loop();
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject();
        };

        img.src = url;
    });
};

export default compressImage;