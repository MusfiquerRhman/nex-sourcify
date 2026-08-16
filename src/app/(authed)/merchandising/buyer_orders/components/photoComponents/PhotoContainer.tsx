"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import type { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import { clearIcon, maximizeIcon } from "~/assets";
import compressImage, { MAX_SIZE_KB } from "~/utils/images/imageCompression";
import { Loader, Portal } from "~/components";
import { toast } from 'sonner';
import { canLoadImage, isValidImage } from "~/utils/images/validations";
import { normalizeToJpeg } from "~/utils/images/normalizeToJPEG";
import { baseUrl } from "~/utils/config";
import Link from "next/link";
import { api } from "~/trpc/react";
import Guidelines from "./Guidelines";

interface PhotoContainerProps {
  methods: ReturnType<typeof useBuyerOrderForm>["methods"];
  id: string;
  can_update?: boolean;
}

type ImageItem =
    | {
        file: File;
        preview: string;
        isRemote?: false;
    }
    | {
        file: null;
        preview: string;
        isRemote: true;
    };

type ImagesState = Record<string | number, ImageItem | null>;

const PhotoContainer = ({ methods, id, can_update }: PhotoContainerProps) => {
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState<ImagesState>({});

    const utils = api.useUtils();

    // Extract styles with db_id from form state
    const styles = methods.watch("order.styles")?.filter(
        style => style.db_id != null
    )?.map((style) => ({
        style: style.style,
        id: style.db_id as string | number,
        photo_url: style.photo_url ?? null,
        file_size: style.file_size ?? null,
    })) || [];


    // Initialize images state with existing photo URLs from styles
    useEffect(() => {
        if (!styles.length) return;

        setImages((prev) => {
            const updated = { ...prev };

            styles.forEach((style) => {
                const key = String(style.id);

                if (style.photo_url && !updated[key]) {
                    updated[key] = {
                        file: null,
                        preview: style.photo_url,
                        isRemote: true,
                    };
                }
            });

            return updated;
        });
    }, [JSON.stringify(styles)]);

    // Handle file selection and processing
    const handleUpload = async (e: ChangeEvent<HTMLInputElement>, styleId: string | number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsImageProcessing(true);

            // Validate type
            if (!isValidImage(file)) {
                toast.error("Unsupported file type.");
                return;
            }
            
            // Normalize to JPEG
            const normalized = await normalizeToJpeg(file);

            // Compress
            const compressed = await compressImage(normalized, MAX_SIZE_KB);
            
            // Check if browser can load the compressed image (catches corruption issues)
            if (!!compressed.type) {
                const ok = await canLoadImage(compressed);
                if (!ok) {
                    toast.error("Invalid or corrupted image.");
                    return;
                }
            }
            else {
                toast.error("Image processing failed. Make sure the file is a valid image and try again.");
                return;
            }
            
            // Preview
            const preview = URL.createObjectURL(compressed);

            const key = String(styleId);

            setImages((prev) => ({
                ...prev,
                [key]: { file: compressed, preview },
            }));
        } catch (err) {
            toast.error("Image processing failed. Make sure the file is a valid image and try again.");
        } finally {
            setIsImageProcessing(false);
        }
    };

    const handleDelete = async (styleId: string | number, photoUrl: string | null) => {
        const key = String(styleId);

        if(photoUrl && images[key]?.isRemote) {
             try {
                const formData = new FormData();
                
                Object.entries(images).forEach(([styleId, imageItem]) => {
                    if (imageItem?.file) {
                        formData.append("styleId", styleId);
                    }
                });
                
                const res = await fetch(`/api/style_photo?styleId=${styleId}`, {
                    method: "DELETE",
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Failed to delete photos.");
                }
                else {
                    const data = await res.json();
                    if (data.success) {
                        toast.success("Photos deleted successfully!");
                        await utils.buyerOrders.getBuyerOrderById.invalidate({ id });
                    } else {
                        throw new Error(data.message || "Failed to delete photos.");
                    }
                }
            } catch (err) {
                toast.error("Failed to submit photos. Please try again.");
            }
            finally {
                setIsSubmitting(false);
            }
        }

        setImages((prev) => {
            const existing = prev[key];
            if (existing?.preview) {
                URL.revokeObjectURL(existing.preview);
            }

            return {
                ...prev,
                [key]: null,
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            
            Object.entries(images).forEach(([styleId, imageItem]) => {
                if (imageItem?.file) {
                    formData.append("files", imageItem.file);
                    formData.append("styleIds", styleId);
                }
            });
            
            const res = await fetch("/api/style_photo", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to upload photos.");
            }
            else {
                const data = await res.json();
                if (data.success) {
                    toast.success("Photos uploaded successfully!");
                    await utils.buyerOrders.getBuyerOrderById.invalidate({ id });
                } else {
                    throw new Error(data.message || "Failed to upload photos.");
                }
            }
        } catch (err) {
            toast.error("Failed to submit photos. Please try again.");
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="m-8 shadow-md rounded-md p-4 border border-dashed border-gray-400" id="photo">
            {isSubmitting ? (
                <Loader />
            ) : (
                <>
                    <h3 className="mb-4 text-2xl font-semibold text-gray-800">Upload Style Images</h3>
                    
                    <div className="mb-6 flex flex-row flex-wrap gap-6">
                        {styles.map((style) => {
                            const key = String(style.id);
                            const image = images[key];
                            return (
                                <div key={style.id} className="w-full xl:w-full 2xl:w-[calc(50%-12px)]">
                                    <h3 className="text-lg font-semibold text-gray-500 mb-2">Style: {style.style}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {image ? (
                                            <div className="w-full md:w-auto flex flex-row">
                                                <div className="relative">
                                                    <img
                                                        src={image.preview}
                                                        alt="preview"
                                                        className="object-cover shadow-md rounded-md max-w-[350px]"
                                                    />

                                                    {/* Delete button */}
                                                    {can_update && 
                                                        <button
                                                            type="button"
                                                            disabled={!can_update}
                                                            onClick={() => handleDelete(style.id, style.photo_url)}
                                                            className="absolute top-1 right-1 bg-white/50 backdrop-blur-md text-xs p-1 rounded w-8 h-8 hover:cursor-pointer hover:bg-white"
                                                        >
                                                            <img src={clearIcon.src} alt="Clear"/>
                                                        </button>
                                                    }
                                                    {style.photo_url && <Link
                                                        href={`${baseUrl}${style.photo_url}` || '#'} target="_blank" 
                                                        className="absolute bottom-1 right-1 bg-white/50 backdrop-blur-md text-xs p-1 rounded w-8 h-8 hover:cursor-pointer hover:bg-white"
                                                    >
                                                        <img src={maximizeIcon.src} alt="Maximize"/>
                                                    </Link>}
                                                </div>
                                                <div className="ml-8 flex justify-center flex-col gap-1">
                                                    {image.file ? (
                                                        <>
                                                            <p className="text-gray-500">{image.file.name}</p>
                                                            <p className="text-gray-500">Compressed Size: {Math.round(image.file.size / 1024)} KB</p>
                                                        </>
                                                    ) 
                                                    : (
                                                        <>
                                                            <p className="text-gray-500">{style.photo_url?.split(')').pop()?.slice(1)}</p>
                                                            <p className="text-gray-500">Compressed Size: {Math.round((style?.file_size ?? 0) / 1024)} KB</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="w-64 h-16 border border-dashed border-gray-400 bg-gray-200 flex items-center justify-center rounded-md cursor-pointer hover:bg-gray-300">
                                                <span className="text-sm text-gray-500">+ Upload</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleUpload(e, style.id)}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isImageProcessing &&
                        <Portal>
                            <div className="fixed z-50 top-0 left-0 h-dvh w-dvw backdrop-blur-xs">
                                <div className="flex flex-1 h-full flex-col gap-4 items-center justify-center">
                                    <div className="loader"/>
                                    <p className="text-center font-bold text-lg">Processing Image</p>
                                </div>
                            </div>
                        </Portal>
                    }

                    <div className="w-full justify-end">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                            disabled={Object.values(images).filter(Boolean).length === 0 || !can_update}
                        >
                            Submit Photos
                        </button>
                    </div>
                    
                    <Guidelines />
                </>
            )}
        </div>
    );
};

export default PhotoContainer;