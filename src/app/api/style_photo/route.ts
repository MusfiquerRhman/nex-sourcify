import { writeFile } from "fs/promises";
import { promises as fs } from "fs";
import path from "path";
import { db } from "~/server/db";

export async function POST(req: Request) {
    const data = await req.formData();
    
    const files = data.getAll("files") as File[];
    const styleIds = data.getAll("styleIds") as string[];
    
    const uploadDir = path.join(process.cwd(), "public/uploads/style_photos");
    
    // Ensure upload directory exists
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }
    
    try {
        const results: { styleId: string; filePath: string, fileSize: number }[] = [];

        // Process each file and corresponding style ID
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const styleId = styleIds[i];

            if (!file || styleId === undefined) {
                return Response.json({ 
                    success: false, 
                    message: `Invalid file or style ID.` 
                }, { status: 400 });
            }

            if (!file.type.startsWith("image/")) {
                return Response.json({ 
                    success: false, 
                    message: `File ${file.name} is not an image.` 
                }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // unique filename
            const fileName = `(${styleId})-${file.name}`;
            const filePath = path.join(uploadDir, fileName);

            await writeFile(filePath, buffer);

            results.push({
                styleId,
                filePath: `/uploads/style_photos/${fileName}`,
                fileSize: file.size,
            });
        }

        // Update database with new photo URLs
        results.forEach(({ styleId, filePath, fileSize }) => {
            db.$transaction(async (tx) => {
                await tx.order_styles.update({
                    where: { id: styleId },
                    data: { photo_url: filePath, file_size: fileSize },
                });
            });
        });

        return Response.json({
            success: true,
            files: results,
        });
    }
    catch (err) {
        return Response.json({ 
            success: false, 
            message: "Failed to update database with photo URLs." 
        }, { status: 500 });
    }
}


export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const styleId = searchParams.get("styleId");

        if(!styleId) {
            return Response.json({ 
                success: false, 
                message: "Missing styleId parameter." 
            }, { status: 400 });
        }
        
        // Get photo path from DB
        const record = await db.order_styles.findUnique({
            where: { id: styleId },
            select: { photo_url: true },
        });

        if (!record) {
            return Response.json({ 
                success: false, 
                message: "Style not found." 
            }, { status: 404 });
        }

        // Delete file if exists
        if (record.photo_url) {
            const filePath = path.join(
                process.cwd(),
                "public",
                record.photo_url // e.g. /uploads/style_photos/xxx.jpg
            );

            try {
                await fs.unlink(filePath);
            } catch (err: any) {
                // ENOENT = file already missing -> ignore
                if (err.code !== "ENOENT") {
                    throw err; 
                }
            }
        }

        // Update DB
        await db.order_styles.update({
            where: { id: styleId },
            data: { 
                photo_url: null,
                file_size: null,
            },
        });

        return Response.json({
            success: true,
            message: "Photo deleted successfully.",
        });
        
    } catch (err) {
        return Response.json(
            {
                success: false,
                message: "Failed to remove photo.",
            },
            { status: 500 }
        );
    }
}