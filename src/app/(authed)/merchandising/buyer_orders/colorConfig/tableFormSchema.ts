import z from "zod";

export const colorSchema = z.object({
    db_id: z.string().optional(),
    color_id: z.string().min(1, "Color is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
});

export type ColorFormValues = z.infer<typeof colorSchema>;