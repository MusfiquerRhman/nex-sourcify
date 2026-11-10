import { z } from "zod";

export const sampleChecklistStatusOptions = [
    { label: "Approved", value: 1, type: "success" },
    { label: "Approved with Comments", value: 0, type: "warning" },
    { label: "Failed", value: -1, type: "error" },
] as const;

export const sampleChecklistSections = [
    { name: "fabric", label: "Fabric", relation: "sample_check_list_fabric_images" },
    { name: "trims_accessories", label: "Trims/Accessories", relation: "sample_check_list_trims_accessories_images" },
    { name: "workmanship", label: "Workmanship", relation: "sample_check_list_workmanship_images" },
    { name: "fitting", label: "Fitting", relation: "sample_check_list_fitting_images" },
    { name: "measurement", label: "Measurement", relation: "sample_check_list_measurement_images" },
    { name: "pattern", label: "Pattern", relation: "sample_check_list_pattern_images" },
    { name: "print_emb", label: "Print/EMB.", relation: "sample_check_list_print_images" },
    { name: "wash", label: "Wash", relation: "sample_check_list_wash_images" },
    { name: "labels", label: "Labels", relation: "sample_check_list_labels_images" },
    { name: "risk_area", label: "Risk Area", relation: "sample_check_list_risk_area_images" },
    { name: "other", label: "Additional (Other) Images", relation: "sample_check_list_other_images" },
] as const;

export const sampleChecklistImageSectionSchema = z.enum([
    "fabric",
    "trims_accessories",
    "workmanship",
    "fitting",
    "measurement",
    "pattern",
    "print_emb",
    "wash",
    "labels",
    "risk_area",
    "other",
]);
export type SampleChecklistImageSection = z.infer<typeof sampleChecklistImageSectionSchema>;

export const sampleChecklistLabelFields = [
    { name: "main_label", label: "Main Label" },
    { name: "main_label_position", label: "Main Label Position" },
    { name: "size_label", label: "Size Label" },
    { name: "size_label_position", label: "Size Label Position" },
    { name: "care_label", label: "Care Label" },
    { name: "care_label_position", label: "Care Label Position" },
] as const;

export const sampleChecklistLabelOptions = [
    { label: "N/A", value: 0 },
    { label: "OK", value: 1 },
    { label: "MISSING", value: -1 },
    { label: "NOT OKAY", value: -2 },
];

export const sampleChecklistImageSchema = z.object({ id: z.string().uuid(), url: z.string() });
export type SampleChecklistImage = z.infer<typeof sampleChecklistImageSchema>;
export const sampleChecklistImageFilenameSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i);
export const getSampleChecklistImageUrl = (section: SampleChecklistImageSection, imageId: string, checklistId: string) => {
    return `/uploads/sample_checklist/${section}/${imageId}.jpg?${new URLSearchParams({ checklistId }).toString()}`;
};

export const sampleChecklistImagesResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    images: z.array(sampleChecklistImageSchema).optional(),
});
