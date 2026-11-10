"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { clearIcon, maximizeIcon } from "~/assets";
import { Loader, Portal } from "~/components";
import { api } from "~/trpc/react";
import compressImage, { MAX_SIZE_KB } from "~/utils/images/imageCompression";
import { ppMeetingImagesResponseSchema, type PPMeetingImage, type PPMeetingImageSection } from "~/utils/images/ppMeetingImages";
import { canLoadImage, isValidImage } from "~/utils/images/validations";

type Props = {
    meetingId: string;
    section: PPMeetingImageSection;
    title: string;
    images: PPMeetingImage[];
    disabled?: boolean;
};

type PendingImage = {
    id: string;
    file: File;
    preview: string;
};

const getAuthHeaders = () => {
    const headers = new Headers();
    const token = localStorage.getItem('token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
};

const readResponse = async (response: Response) => {
    const json: unknown = await response.json();
    const result = ppMeetingImagesResponseSchema.safeParse(json);

    if (!response.ok || !result.success || !result.data.success) {
        throw new Error(result.success ? result.data.message ?? 'Failed to update photos.' : 'Failed to update photos.');
    }

    return result.data;
};

const PhotoSection = (props: Props) => {
    const { meetingId, section, title, images, disabled = false } = props;

    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const previewUrls = useRef(new Set<string>());
    const nextImageId = useRef(0);
    const isMounted = useRef(true);
    const isBusy = useRef(false);
    const utils = api.useUtils();

    const imageKey = section === 'pps_views' ? 'ppsImages' : 'sizeSetImages';
    const isAttendancePhoto = section === 'attendance_lists';
    const isDisabled = disabled || isImageProcessing || isSubmitting || deletingId !== null;

    useEffect(() => {
        const urls = previewUrls.current;
        isMounted.current = true;

        return () => {
            isMounted.current = false;
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (!files.length || disabled || isBusy.current) return;

        isBusy.current = true;
        setIsImageProcessing(true);
        const processed: PendingImage[] = [];

        try {
            const { normalizeToJpeg } = await import('~/utils/images/normalizeToJPEG');

            for (const file of files) {
                try {
                    if (!isValidImage(file)) throw new Error('Unsupported file type.');

                    const normalized = await normalizeToJpeg(file);
                    const compressed = await compressImage(normalized, MAX_SIZE_KB);

                    if (!compressed.type || !(await canLoadImage(compressed))) 
                        throw new Error('Invalid or corrupted image.');

                    if (compressed.size > MAX_SIZE_KB * 1024) 
                        throw new Error(`The image could not be compressed below ${MAX_SIZE_KB} KB. Try a smaller image.`);

                    if (!isMounted.current) break;

                    const preview = URL.createObjectURL(compressed);
                    previewUrls.current.add(preview);
                    processed.push({ 
                        id: String(nextImageId.current++), 
                        file: compressed, 
                        preview 
                    });

                } catch (error) {
                    if (!isMounted.current) break;
                    toast.error(`${file.name}: ${error instanceof Error ? error.message : 'Image processing failed. Please try another image.'}`);
                }
            }

            if (isMounted.current && processed.length) {
                if (isAttendancePhoto) {
                    pendingImages.forEach((image) => {
                        URL.revokeObjectURL(image.preview);
                        previewUrls.current.delete(image.preview);
                    });
                }

                setPendingImages((previous) => isAttendancePhoto ? processed : [...previous, ...processed]);
            }
        } catch {
            toast.error('Image processing failed. Please try again.');
        } finally {
            isBusy.current = false;
            if (isMounted.current) setIsImageProcessing(false);
        }
    };

    const handleRemovePending = (image: PendingImage) => {
        if (disabled || isBusy.current) return;

        URL.revokeObjectURL(image.preview);
        previewUrls.current.delete(image.preview);
        setPendingImages((previous) => previous.filter((pending) => pending.id !== image.id));
    };

    const handleDelete = async (image: PPMeetingImage) => {
        if (disabled || isBusy.current) return;

        isBusy.current = true;
        setDeletingId(image.id);

        try {
            const params = new URLSearchParams({ meetingId, section, imageId: image.id });
            await readResponse(await fetch(`/api/pp_meeting?${params.toString()}`, 
                { method: 'DELETE', headers: getAuthHeaders() }
            ));

            utils.ppMeeting.getPPMeetingById.setData({ id: meetingId }, (previous) => {
                if (!previous) return previous;
                if (isAttendancePhoto) return { 
                    ...previous, 
                    attendance_list_photo: null 
                };

                return { ...previous, [imageKey]: previous[imageKey].filter((photo) => photo.id !== image.id) };
            });

            toast.success('Photo deleted successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete photo. Please try again.');
        } finally {
            isBusy.current = false;
            if (isMounted.current) setDeletingId(null);
        }
    };

    const handleSubmit = async () => {
        if (disabled || isBusy.current || !pendingImages.length) return;

        isBusy.current = true;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('meetingId', meetingId);
            formData.append('section', section);
            pendingImages.forEach((image) => formData.append('files', image.file));

            const data = await readResponse(await fetch('/api/pp_meeting', { 
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: formData 
            }));
            
            const uploadedImages = data.images;
            const firstImage = uploadedImages?.[0];
            
            if (!uploadedImages || !firstImage) 
                throw new Error('The upload response did not include the saved images. Refresh the meeting before trying again.');

            utils.ppMeeting.getPPMeetingById.setData({ id: meetingId }, (previous) => {
                if (!previous) return previous;
                if (isAttendancePhoto) return { ...previous, attendance_list_photo: firstImage.url };

                return {
                    ...previous,
                    [imageKey]: [...previous[imageKey], ...uploadedImages.filter((image) => !previous[imageKey].some((photo) => photo.id === image.id))],
                };
            });

            pendingImages.forEach((image) => {
                URL.revokeObjectURL(image.preview);
                previewUrls.current.delete(image.preview);
            });
            if (isMounted.current) setPendingImages([]);

            toast.success('Photos uploaded successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload photos. Please try again.');
        } finally {
            isBusy.current = false;
            if (isMounted.current) setIsSubmitting(false);
        }
    };

    return (
        <section className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-500">{title}</h3>

            <div className="mb-4 flex flex-wrap gap-6">
                {images.map((image, index) => (
                    <div key={image.id} className="relative w-fit max-w-full">
                        <Image src={image.url} alt={`${title} image ${index + 1}`} width={350} height={350} unoptimized
                            className="max-h-[350px] w-auto max-w-full rounded-md object-contain shadow-md"
                        />
                        {!disabled && (
                            <button type="button" aria-label={`Delete ${title} image ${index + 1}`}
                                onClick={() => handleDelete(image)} disabled={isDisabled}
                                className="absolute right-1 top-1 h-8 w-8 cursor-pointer rounded bg-white/50 p-1 text-xs backdrop-blur-md hover:bg-white disabled:cursor-not-allowed"
                            >
                                <Image src={clearIcon.src} alt="Clear" width={24} height={24} />
                            </button>
                        )}
                        <a href={image.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} image ${index + 1}`}
                            className="absolute bottom-1 right-1 h-8 w-8 cursor-pointer rounded bg-white/50 p-1 text-xs backdrop-blur-md hover:bg-white"
                        >
                            <Image src={maximizeIcon.src} alt="Maximize" width={24} height={24} />
                        </a>
                    </div>
                ))}

                {pendingImages.map((image) => (
                    <div key={`pending-${image.id}`} className="w-fit max-w-full">
                        <div className="relative">
                            <Image src={image.preview} alt={`${title} preview: ${image.file.name}`} width={350} height={350} unoptimized
                                className="max-h-[350px] w-auto max-w-full rounded-md object-contain shadow-md"
                            />
                            <button type="button" aria-label={`Remove ${image.file.name}`} disabled={isDisabled}
                                onClick={() => handleRemovePending(image)}
                                className="absolute right-1 top-1 h-8 w-8 cursor-pointer rounded bg-white/50 p-1 text-xs backdrop-blur-md hover:bg-white disabled:cursor-not-allowed"
                            >
                                <Image src={clearIcon.src} alt="Clear" width={24} height={24} />
                            </button>
                        </div>
                        <p className="mt-2 break-all text-sm text-gray-500">{image.file.name}</p>
                        <p className="text-sm text-gray-500">Compressed Size: {Math.round(image.file.size / 1024)} KB</p>
                    </div>
                ))}

                {!disabled && (
                    <label className={`flex h-16 w-64 items-center justify-center rounded-md border border-dashed border-gray-400 bg-gray-200 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-300'}`}>
                        <span className="text-sm text-gray-500">{isAttendancePhoto && (images.length || pendingImages.length) ? 'Replace Photo' : '+ Upload'}</span>
                        <input type="file" multiple={!isAttendancePhoto} accept=".jpg,.jpeg,.png,.webp,.heic,.heif" aria-label={`Upload ${title} images`}
                            onChange={handleUpload} disabled={isDisabled} className="hidden"
                        />
                    </label>
                )}

                {disabled && !images.length && !pendingImages.length && <p className="text-sm text-gray-500">No images uploaded.</p>}
            </div>

            {(isSubmitting || deletingId !== null) && <Loader />}

            {!disabled && (
                <button type="button" onClick={handleSubmit} disabled={isDisabled || !pendingImages.length}
                    className="cursor-pointer rounded-md bg-secondary px-6 py-2 text-white hover:bg-secondary disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {isAttendancePhoto ? 'Submit Photo' : 'Submit Photos'}
                </button>
            )}

            {isImageProcessing && (
                <Portal>
                    <div className="fixed left-0 top-0 z-50 h-dvh w-dvw backdrop-blur-xs" role="status" aria-live="polite">
                        <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
                            <div className="loader" />
                            <p className="text-center text-lg font-bold">Processing Images</p>
                        </div>
                    </div>
                </Portal>
            )}
        </section>
    );
};

export default PhotoSection;
