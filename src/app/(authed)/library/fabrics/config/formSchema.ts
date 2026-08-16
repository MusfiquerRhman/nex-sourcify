import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Fabric name must be at least 2 characters long"),
    description: z.string(),
    composition: z.string(),
    value: z.number().min(0, "Value must be a non-negative number"),
    unit: z.string(),
    product_type_id: z.number(),
});

export type FormValues = z.infer<typeof formSchema>;