import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { ppMeetingImageFilenameSchema, ppMeetingImageSectionSchema } from "~/utils/images/ppMeetingImages";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ section: string; filename: string }>;
};

const paramsSchema = z.object({ section: ppMeetingImageSectionSchema, filename: ppMeetingImageFilenameSchema });

export async function GET(_req: Request, context: RouteContext) {
    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) return new Response('File not found', { status: 404 });

    try {
        const { section, filename } = params.data;
        const filePath = path.join(process.cwd(), 'public', 'pp_meeting', section, filename);
        const file = await readFile(filePath);

        return new Response(new Uint8Array(file), {
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Length': String(file.length),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
            return new Response('File not found', { status: 404 });
        }

        console.error('[PP meeting images] Failed to serve image:', error);
        return new Response('Failed to load image', { status: 500 });
    }
}
