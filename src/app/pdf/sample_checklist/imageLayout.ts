export type PDFImageSize = { width: number; height: number };

export const fitPDFImage = (image: PDFImageSize, bounds: PDFImageSize): PDFImageSize => {
    if (!Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width <= 0 || image.height <= 0) {
        throw new Error("Invalid checklist photo dimensions.");
    }

    const scale = Math.min(1, bounds.width / image.width, bounds.height / image.height);
    return { width: image.width * scale, height: image.height * scale };
};

export const groupPDFImages = <T extends PDFImageSize>(images: T[], availableWidth: number, gap: number): T[][] => {
    const rows: T[][] = [];
    let row: T[] = [];
    let usedWidth = 0;

    for (const image of images) {
        const requiredWidth = image.width + (row.length ? gap : 0);
        if (row.length && usedWidth + requiredWidth > availableWidth) {
            rows.push(row);
            row = [];
            usedWidth = 0;
        }

        usedWidth += image.width + (row.length ? gap : 0);
        row.push(image);
    }

    if (row.length) rows.push(row);
    return rows;
};
