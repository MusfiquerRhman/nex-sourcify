import { sampleChecklistStatusOptions } from "~/utils/sampleChecklist";

export const tableHeaders = [
    { key: "sample_ref_no", label: "Reference No" },
    { key: "submission_no", label: "Submission No" },
    // { key: "sample_check_date", label: "Date", type: "date" },
    { key: "buyer_name", label: "Buyer" },
    { key: "factory_name", label: "Factory" },
    // { key: "ref_no", label: "Order Ref" },
    { key: "style", label: "Style" },
    { key: "color", label: "Color" },
    { key: "sample_type", label: "Sample Type" },
    // { key: "sample_size", label: "Sample Size" },
    { key: "sample_quantity", label: "Sample Quantity" },
    {
        key: "status",
        label: "Status",
        type: "chip",
        chips: {
            ...Object.fromEntries(sampleChecklistStatusOptions.map(({ value, label, type }) => [value, { label, type }])),
            null: { label: "Not Checked", type: "info" },
        },
    },
    { key: "actions", label: "", type: "action" },
];
