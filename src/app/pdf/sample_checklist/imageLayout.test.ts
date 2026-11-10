import assert from "node:assert/strict";
import { test } from "node:test";
import { fitPDFImage, groupPDFImages } from "./imageLayout";

void test("portrait section photos reserve their proportional width and 100pt height", () => {
    const size = fitPDFImage({ width: 600, height: 900 }, { width: 543.78, height: 100 });
    assert.equal(size.height, 100);
    assert.ok(Math.abs(size.width - 66.6667) < 0.001);
});

void test("wide photos use the available row width without stretching or overflowing", () => {
    const size = fitPDFImage({ width: 1800, height: 300 }, { width: 543.78, height: 100 });
    assert.equal(size.width, 543.78);
    assert.ok(size.height <= 100);
    assert.equal(size.width / size.height, 6);
});

void test("additional images can occupy the full printable page while preserving their ratio", () => {
    const size = fitPDFImage({ width: 1200, height: 1800 }, { width: 555.28, height: 727.89 });
    assert.equal(size.height, 727.89);
    assert.ok(size.width <= 555.28);
    assert.ok(Math.abs(size.width / size.height - 2 / 3) < 0.0001);
});

void test("small additional images retain their native size", () => {
    assert.deepEqual(fitPDFImage({ width: 120, height: 80 }, { width: 555.28, height: 727.89 }), { width: 120, height: 80 });
});

void test("row packing includes gaps and preserves every image in order", () => {
    const images = [
        { id: 1, width: 200, height: 100 },
        { id: 2, width: 200, height: 100 },
        { id: 3, width: 150, height: 100 },
    ];
    const rows = groupPDFImages(images, 500, 8);
    assert.deepEqual(
        rows.map((row) => row.map((image) => image.id)),
        [[1, 2], [3]],
    );
    for (const row of rows) assert.ok(row.reduce((width, image) => width + image.width, 0) + (row.length - 1) * 8 <= 500);
    assert.deepEqual(rows.flat(), images);
});

void test("empty photo lists and invalid image dimensions are handled explicitly", () => {
    assert.deepEqual(groupPDFImages([], 500, 8), []);
    for (const width of [0, -1, NaN, Infinity]) {
        assert.throws(() => fitPDFImage({ width, height: 100 }, { width: 500, height: 100 }), /Invalid checklist photo dimensions/);
    }
});
