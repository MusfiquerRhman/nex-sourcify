import { useEffect, useMemo, useState } from "react";
import { getSampleChecklistImageUrl, sampleChecklistSections } from "~/utils/sampleChecklist";
import type { SampleChecklistPDFData, SampleChecklistPDFImage, SampleChecklistPDFImages } from "./types";

type ImageResult = { key: string; images: SampleChecklistPDFImages; error: string | null };

const readImage = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read a checklist photo.")));
        reader.onerror = () => reject(new Error("Could not read a checklist photo."));
        reader.readAsDataURL(blob);
    });

const loadImage = async (blob: Blob): Promise<SampleChecklistPDFImage> => {
    const src = await readImage(blob);

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            if (!image.naturalWidth || !image.naturalHeight) return reject(new Error("Invalid checklist photo dimensions."));
            resolve({ src, width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => reject(new Error("Could not load a checklist photo."));
        image.src = src;
    });
};

export const usePDFImages = (data: SampleChecklistPDFData | undefined) => {
    const [result, setResult] = useState<ImageResult | null>(null);
    const [attempt, setAttempt] = useState(0);
    const imageKey = useMemo(
        () =>
            data
                ? [data.id, ...sampleChecklistSections.flatMap((section) => data[section.relation].map((image) => `${section.name}/${image.id}`))].join("|")
                : "",
        [data],
    );

    useEffect(() => {
        if (!data) return;
        const controller = new AbortController();

        const loadImages = async () => {
            try {
                const headers = new Headers();
                const token = localStorage.getItem("token");
                if (token) headers.set("Authorization", `Bearer ${token}`);
                const requests = sampleChecklistSections.flatMap((section) => data[section.relation].map((image) => ({ section, image })));
                const images: SampleChecklistPDFImages = {};

                for (let index = 0; index < requests.length; index += 4) {
                    await Promise.all(
                        requests.slice(index, index + 4).map(async ({ section, image }) => {
                            const response = await fetch(getSampleChecklistImageUrl(section.name, image.id, data.id), { headers, signal: controller.signal });
                            if (!response.ok)
                                throw new Error(`A ${section.label} photo could not be loaded. Retry or check the uploaded photo before printing.`);
                            images[image.id] = await loadImage(await response.blob());
                        }),
                    );
                }

                if (!controller.signal.aborted) setResult({ key: imageKey, images, error: null });
            } catch (error) {
                if (controller.signal.aborted) return;
                setResult({ key: imageKey, images: {}, error: error instanceof Error ? error.message : "Failed to load checklist photos." });
                controller.abort();
            }
        };
        void loadImages();

        return () => controller.abort();
    }, [data, imageKey, attempt]);

    return {
        images: result?.key === imageKey ? result.images : {},
        error: result?.key === imageKey ? result.error : null,
        isLoading: !!data && result?.key !== imageKey,
        retry: () => {
            setResult(null);
            setAttempt((previous) => previous + 1);
        },
    };
};
