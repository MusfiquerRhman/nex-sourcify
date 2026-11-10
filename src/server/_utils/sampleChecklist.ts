import type { Prisma } from "@prisma/client";

const imageSelect = {
    select: { id: true, url: true },
    orderBy: [{ added_at: "asc" }, { id: "asc" }],
} satisfies Prisma.sample_check_list_fabric_imagesFindManyArgs;

export const sampleChecklistImagesInclude = {
    sample_check_list_fabric_images: imageSelect,
    sample_check_list_trims_accessories_images: imageSelect,
    sample_check_list_workmanship_images: imageSelect,
    sample_check_list_fitting_images: imageSelect,
    sample_check_list_measurement_images: imageSelect,
    sample_check_list_pattern_images: imageSelect,
    sample_check_list_print_images: imageSelect,
    sample_check_list_wash_images: imageSelect,
    sample_check_list_labels_images: imageSelect,
    sample_check_list_risk_area_images: imageSelect,
    sample_check_list_other_images: imageSelect,
} satisfies Prisma.sample_check_listInclude;
