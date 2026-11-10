import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

for (const pathname of [
    "/sample_checklist",
    "/sample_checklist/fabric/photo.jpg",
    "/sample%5fchecklist/fabric/photo.jpg",
    "/sample_checklist%2ffabric%2fphoto.jpg",
    "/other%2f..%2fsample_checklist/fabric/photo.jpg",
    "/sample_checklist%5cfabric%5cphoto.jpg",
    "/SAMPLE_CHECKLIST/fabric/photo.jpg",
]) {
    void test(`direct static photo access is blocked: ${pathname}`, () => {
        const response = middleware(new NextRequest(`http://localhost${pathname}`));
        assert.equal(response.status, 404);
    });
}

for (const pathname of ["/uploads/sample_checklist/fabric/photo.jpg", "/api/sample_checklist", "/quality/sample_checklist", "/uploads/style_photos/photo.jpg"]) {
    void test(`application and authenticated image routes remain accessible: ${pathname}`, () => {
        const response = middleware(new NextRequest(`http://localhost${pathname}`));
        assert.equal(response.headers.get("x-middleware-next"), "1");
        assert.ok(response.headers.get("content-security-policy")?.includes("img-src 'self' data: blob:"));
        assert.ok(response.headers.get("x-nonce"));
    });
}

void test("malformed URL encoding is rejected", () => {
    assert.equal(middleware(new NextRequest("http://localhost/sample%zzchecklist/photo.jpg")).status, 400);
});
