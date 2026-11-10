import { z } from "zod";
import { GET as getSampleChecklistImage } from "~/app/api/sample_checklist/route";
import { sampleChecklistImageFilenameSchema, sampleChecklistImageSectionSchema } from "~/utils/sampleChecklist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
    params: Promise<{ section: string; filename: string }>;
};

const paramsSchema = z.object({ section: sampleChecklistImageSectionSchema, filename: sampleChecklistImageFilenameSchema });

export async function GET(req: Request, context: RouteContext) {
    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) return new Response("File not found", { status: 404 });

    // Reuse the existing permission and checklist ownership checks for both URL formats.
    const { section, filename } = params.data;
    const url = new URL(req.url);
    url.searchParams.set("section", section);
    url.searchParams.set("imageId", filename.slice(0, -4));

    return getSampleChecklistImage(new Request(url, { headers: req.headers }));
}
