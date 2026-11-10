import assert from "node:assert/strict";
import { test } from "node:test";
import { getModulePath } from "./modulePath";

void test("sample checklist list, new and edit pages resolve to the same permission module", () => {
    assert.deepEqual(getModulePath('/quality/sample_checklist'), { path: '/quality/sample_checklist', new: false, edit: false });
    assert.deepEqual(getModulePath('/quality/sample_checklist/new'), { path: '/quality/sample_checklist', new: true, edit: false });
    assert.deepEqual(getModulePath('/quality/sample_checklist/edit/checklist-id'), { path: '/quality/sample_checklist', new: false, edit: true });
});

void test("nested modules retain their full permission path on list, new and edit pages", () => {
    for (const modulePath of ['/commercial/tna/tna_templates', '/merchandising/sales_contract/sales_contracts', '/accounting/factory_payment/regular_payment']) {
        assert.deepEqual(getModulePath(modulePath), { path: modulePath, new: false, edit: false });
        assert.deepEqual(getModulePath(`${modulePath}/new`), { path: modulePath, new: true, edit: false });
        assert.deepEqual(getModulePath(`${modulePath}/edit/record-id`), { path: modulePath, new: false, edit: true });
    }
});

void test("new pages with route parameters still use the containing module", () => {
    assert.deepEqual(getModulePath('/commercial/rdl_invoice/new/factory-invoice-id'), { path: '/commercial/rdl_invoice', new: true, edit: false });
});

void test("trailing slashes, reports and single-segment routes retain valid module paths", () => {
    assert.deepEqual(getModulePath('/quality/sample_checklist/new/'), { path: '/quality/sample_checklist', new: true, edit: false });
    assert.deepEqual(getModulePath('/reports/mer_report/sales_report'), { path: '/reports/mer_report/sales_report', new: false, edit: false });
    assert.deepEqual(getModulePath('/dashboard'), { path: '/dashboard', new: false, edit: false });
    assert.deepEqual(getModulePath('/'), { path: '/', new: false, edit: false });
});
