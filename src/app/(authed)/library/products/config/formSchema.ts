import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters long"),
    product_type_id: z.string().optional(),
    is_active: z.boolean().optional(),
});

export type FormValues = z.infer<typeof formSchema>;