import { z } from "zod";

export const ppMeetingImageSectionSchema = z.enum(['pps_views', 'size_set_views', 'attendance_lists']);
export type PPMeetingImageSection = z.infer<typeof ppMeetingImageSectionSchema>;

export const ppMeetingImageFilenameSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i);

export const ppMeetingImageSchema = z.object({
    id: z.string().uuid(),
    url: z.string(),
});
export type PPMeetingImage = z.infer<typeof ppMeetingImageSchema>;

export const ppMeetingImagesResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    images: z.array(ppMeetingImageSchema).optional(),
});
