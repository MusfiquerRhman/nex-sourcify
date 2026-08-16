// Converts various image formats to JPEG using canvas, ensuring better compatibility and compression.
// Used for formats that aren't HEIC/HEIF (which are handled in the normalizeToJpeg.ts file).
export const convertViaCanvas = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject();

            canvas.width = img.width;
            canvas.height = img.height;

            // Fill white background (important for PNG transparency)
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    if (!blob) return reject();

                    resolve(
                        new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                            type: "image/jpeg",
                        })
                    );
                },
                "image/jpeg",
                0.9
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject();
        };

        img.src = url;
    });
};