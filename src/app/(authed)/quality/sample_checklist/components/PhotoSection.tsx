"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { clearIcon, maximizeIcon } from "~/assets";
import { api } from "~/trpc/react";
import compressImage, { MAX_SIZE_KB } from "~/utils/images/imageCompression";
import { canLoadImage, isValidImage } from "~/utils/images/validations";
import {
    getSampleChecklistImageUrl,
    sampleChecklistImagesResponseSchema,
    sampleChecklistSections,
    type SampleChecklistImage,
    type SampleChecklistImageSection,
} from "~/utils/sampleChecklist";

type PhotoSectionProps = {
    checklistId: string;
    section: SampleChecklistImageSection;
    title: string;
    images: SampleChecklistImage[];
    disabled?: boolean;
};

type PendingImage = { id: string; file: File; preview: string };
type SavedPhotoProps = { image: SampleChecklistImage; title: string; checklistId: string; section: SampleChecklistImageSection };

const getAuthHeaders = () => {
    const headers = new Headers();
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
};

const SavedPhoto = (props: SavedPhotoProps) => {
    const { image, title, checklistId, section } = props;
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let previewUrl: string | undefined;
        setError(false);
        setPreview(null);

        const loadImage = async () => {
            try {
                const response = await fetch(getSampleChecklistImageUrl(section, image.id, checklistId), { headers: getAuthHeaders(), signal: controller.signal });
                if (!response.ok) throw new Error("Unable to load image.");
                const blob = await response.blob();
                if (controller.signal.aborted) return;
                previewUrl = URL.createObjectURL(blob);
                setPreview(previewUrl);
            } catch {
                if (!controller.signal.aborted) setError(true);
            }
        };
        void loadImage();

        return () => {
            controller.abort();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [checklistId, section, image.id, retry]);

    if (error) {
        return (
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded border border-red-300 p-4 text-sm text-red-600">
                Photo could not be loaded. Retry
            </button>
        );
    }
    if (!preview)
        return (
            <p role="status" className="p-4 text-sm text-gray-500">
                Loading photo...
            </p>
        );

    return (
        <a href={preview} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} photo`} className="relative block w-fit max-w-full">
            <Image
                src={preview}
                alt={`${title} photo`}
                width={350}
                height={350}
                unoptimized
                className="max-h-[350px] w-auto max-w-full rounded-md object-contain shadow-md"
            />
            <span className="absolute right-1 bottom-1 rounded bg-white/70 p-1">
                <Image src={maximizeIcon.src} alt="Open photo" width={24} height={24} />
            </span>
        </a>
    );
};

const PhotoSection = (props: PhotoSectionProps) => {
    const { checklistId, section, title, images, disabled = false } = props;

    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const isBusy = useRef(false);
    const isMounted = useRef(true);
    const previewUrls = useRef(new Set<string>());
    const utils = api.useUtils();
    const isDisabled = disabled || isProcessing || isUploading || deletingId !== null;

    useEffect(() => {
        const urls = previewUrls.current;
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length || disabled || isBusy.current) return;
        isBusy.current = true;
        setIsProcessing(true);
        const processed: PendingImage[] = [];

        try {
            const { normalizeToJpeg } = await import("~/utils/images/normalizeToJPEG");
            for (const file of files) {
                try {
                    if (!isValidImage(file)) throw new Error("Unsupported file type.");
                    const normalized = await normalizeToJpeg(file);
                    const compressed = await compressImage(normalized, MAX_SIZE_KB);
                    if (!compressed.type || !(await canLoadImage(compressed))) throw new Error("Invalid or corrupted image.");
                    if (compressed.size > MAX_SIZE_KB * 1024) throw new Error(`Try an image that can be compressed below ${MAX_SIZE_KB} KB.`);
                    if (!isMounted.current) break;
                    const preview = URL.createObjectURL(compressed);
                    previewUrls.current.add(preview);
                    processed.push({ id: crypto.randomUUID(), file: compressed, preview });
                } catch (error) {
                    if (isMounted.current) toast.error(`${file.name}: ${error instanceof Error ? error.message : "Failed to process image."}`);
                }
            }
            if (isMounted.current) setPendingImages((previous) => [...previous, ...processed]);
        } catch {
            toast.error("Image processing failed. Please try again.");
        } finally {
            isBusy.current = false;
            if (isMounted.current) setIsProcessing(false);
        }
    };

    const handleRemovePending = (image: PendingImage) => {
        if (disabled || isBusy.current) return;
        URL.revokeObjectURL(image.preview);
        previewUrls.current.delete(image.preview);
        setPendingImages((previous) => previous.filter((item) => item.id !== image.id));
    };

    const handleDelete = async (image: SampleChecklistImage) => {
        if (disabled || isBusy.current) return;
        isBusy.current = true;
        setDeletingId(image.id);

        try {
            const params = new URLSearchParams({ checklistId, section, imageId: image.id });
            const response = await fetch(`/api/sample_checklist?${params.toString()}`, { method: "DELETE", headers: getAuthHeaders() });
            const json: unknown = await response.json();
            const result = sampleChecklistImagesResponseSchema.safeParse(json);
            if (!response.ok || !result.success || !result.data.success) {
                throw new Error(result.success ? (result.data.message ?? "Failed to delete photo.") : "Failed to delete photo.");
            }

            const relation = sampleChecklistSections.find((item) => item.name === section)?.relation;
            if (relation) {
                utils.sampleChecklist.getSampleChecklistById.setData({ id: checklistId }, (previous) => {
                    if (!previous) return previous;
                    return { ...previous, [relation]: previous[relation].filter((photo) => photo.id !== image.id) };
                });
            }

            toast.success("Photo deleted successfully!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete photo.");
        } finally {
            isBusy.current = false;
            if (isMounted.current) setDeletingId(null);
        }
    };

    const handleUpload = async () => {
        if (disabled || isBusy.current || !pendingImages.length) return;
        isBusy.current = true;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("checklistId", checklistId);
            formData.append("section", section);
            pendingImages.forEach((image) => formData.append("files", image.file));

            const response = await fetch("/api/sample_checklist", { method: "POST", headers: getAuthHeaders(), body: formData });
            const json: unknown = await response.json();
            const result = sampleChecklistImagesResponseSchema.safeParse(json);
            if (!response.ok || !result.success || !result.data.success) {
                throw new Error(result.success ? (result.data.message ?? "Failed to upload photos.") : "Failed to upload photos.");
            }
            const uploadedImages = result.data.images;
            if (!uploadedImages?.length) throw new Error("The upload did not return saved photos. Refresh the checklist before retrying.");
            const relation = sampleChecklistSections.find((item) => item.name === section)?.relation;
            if (relation) {
                utils.sampleChecklist.getSampleChecklistById.setData({ id: checklistId }, (previous) => {
                    if (!previous) return previous;
                    return {
                        ...previous,
                        [relation]: [...previous[relation], ...uploadedImages.filter((image) => !previous[relation].some((item) => item.id === image.id))],
                    };
                });
            }

            pendingImages.forEach((image) => {
                URL.revokeObjectURL(image.preview);
                previewUrls.current.delete(image.preview);
            });
            if (isMounted.current) setPendingImages([]);
            toast.success("Photos uploaded successfully!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to upload photos.");
        } finally {
            isBusy.current = false;
            if (isMounted.current) setIsUploading(false);
        }
    };

    return (
        <div className="mt-4">
            <div className="flex flex-wrap items-start gap-4">
                {images.map((image, index) => (
                    <div key={image.id} className="relative w-fit max-w-full">
                        <SavedPhoto image={image} title={title} checklistId={checklistId} section={section} />
                        {!disabled && (
                            <button
                                type="button"
                                aria-label={`Delete ${title} photo ${index + 1}`}
                                aria-busy={deletingId === image.id}
                                title="Delete photo"
                                onClick={() => handleDelete(image)}
                                disabled={isDisabled}
                                className="absolute top-1 right-1 cursor-pointer rounded bg-white/70 p-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Image src={clearIcon.src} alt="Delete" width={24} height={24} />
                            </button>
                        )}
                        {deletingId === image.id && <p role="status" className="mt-2 text-sm text-gray-500">Deleting photo...</p>}
                    </div>
                ))}
                {pendingImages.map((image) => (
                    <div key={image.id} className="relative w-fit max-w-full">
                        <Image
                            src={image.preview}
                            alt={`${title} preview: ${image.file.name}`}
                            width={350}
                            height={350}
                            unoptimized
                            className="max-h-[350px] w-auto max-w-full rounded-md object-contain shadow-md"
                        />
                        <button
                            type="button"
                            aria-label={`Remove pending ${image.file.name}`}
                            onClick={() => handleRemovePending(image)}
                            disabled={isDisabled}
                            className="absolute top-1 right-1 rounded bg-white/70 p-1 disabled:opacity-50"
                        >
                            <Image src={clearIcon.src} alt="Remove" width={24} height={24} />
                        </button>
                        <p className="mt-2 text-sm text-gray-500">Pending upload ({Math.round(image.file.size / 1024)} KB)</p>
                    </div>
                ))}
                {!disabled && (
                    <label
                        className={`flex h-16 w-64 items-center justify-center rounded-md border border-dashed border-gray-400 bg-gray-200 ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-300"}`}
                    >
                        <span className="text-sm text-gray-600">{isProcessing ? "Processing images..." : "+ Select Images"}</span>
                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                            aria-label={`Select ${title} images`}
                            onChange={handleSelect}
                            disabled={isDisabled}
                            className="hidden"
                        />
                    </label>
                )}
                {disabled && !images.length && <p className="text-sm text-gray-500">No images uploaded.</p>}
            </div>
            {!disabled && pendingImages.length > 0 && (
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isDisabled}
                    className="bg-secondary mt-4 cursor-pointer rounded-md px-6 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {isUploading ? "Uploading Photos..." : `Upload ${pendingImages.length} Photo${pendingImages.length === 1 ? "" : "s"}`}
                </button>
            )}
        </div>
    );
};

export default PhotoSection;
