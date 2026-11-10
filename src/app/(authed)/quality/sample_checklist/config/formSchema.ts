import { z } from "zod";

const labelStatus = z.union([z.literal(0), z.literal(1), z.literal(-1), z.literal(-2)]);

export const sampleChecklistFormSchema = z.object({
    with_order: z.boolean(),
    sample_check_date: z.string().date("Sample check date is required"),
    buyer_id: z.number().int().positive("Buyer is required"),
    factory_id: z.number().int().positive("Factory is required"),
    order_id: z.string(),
    style_id: z.string(),
    style_no_manual: z.string().trim().max(50, "Style must be at most 50 characters"),
    color_id: z.number().int().positive("Color is required"),
    sample_type: z.number().int().positive("Sample type is required"),
    status: z.union([z.literal(1), z.literal(0), z.literal(-1)], { errorMap: () => ({ message: "Select a status" }) }),
    sample_size: z.string().max(50),
    sample_quantity: z.number({ required_error: "Sample quantity is required", invalid_type_error: "Sample quantity is required" })
        .int("Sample quantity must be a whole number").min(0).max(2147483647),
    fabric: z.string(),
    trims_accessories: z.string(),
    workmanship: z.string(),
    fitting: z.string(),
    measurement: z.string(),
    pattern: z.string(),
    print_emb: z.string(),
    wash: z.string(),
    main_label: labelStatus,
    main_label_position: labelStatus,
    size_label: labelStatus,
    size_label_position: labelStatus,
    care_label: labelStatus,
    care_label_position: labelStatus,
    risk_area: z.string(),
}).superRefine((values, ctx) => {
    if (values.with_order) {
        if (!z.string().uuid().safeParse(values.order_id).success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["order_id"], message: "Order is required" });
        }
        if (!z.string().uuid().safeParse(values.style_id).success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["style_id"], message: "Style is required" });
        }
    } else if (!values.style_no_manual) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["style_no_manual"], message: "Style is required" });
    }
});

export type SampleChecklistFormValues = z.infer<typeof sampleChecklistFormSchema>;
