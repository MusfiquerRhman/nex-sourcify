/**
 * This file is a Next.js API route that serves files from the "public/uploads" directory. 
 * It handles GET requests and returns the requested file if it exists, 
 * while also ensuring that the requested path is secure and does not allow for directory traversal attacks. 
 * The response includes appropriate MIME types based on the file extension and sets caching headers for better performance.
 */

import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export async function GET( req: NextRequest, context: any) {
	const { params } = context as { params: { path: string[] } };

	try {
		const filePath = path.join(process.cwd(), "public", "uploads", ...params.path);

		const normalized = path.normalize(filePath);
		const basePath = path.join(process.cwd(), "public", "uploads");

		if (!normalized.startsWith(basePath)) {
			return new Response("Forbidden", { status: 403 });
		}

		if (!fs.existsSync(normalized)) {
			return new Response("File not found", { status: 404 });
		}

		const fileBuffer = fs.readFileSync(normalized);

		const ext = path.extname(normalized).toLowerCase();

		const mimeTypes: Record<string, string> = {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp",
			".gif": "image/gif",
			".svg": "image/svg+xml",
		};

		return new Response(fileBuffer, {
			status: 200,
			headers: {
				"Content-Type": mimeTypes[ext] || "application/octet-stream",
				"Cache-Control": "public, max-age=31536000",
			},
		});
	} 
	catch (error) {
		return new Response("Internal Server Error", { status: 500 });
	}
}