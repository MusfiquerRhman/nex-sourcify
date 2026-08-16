import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Product type name must be at least 2 characters long"),
    is_active: z.boolean(),
});

export type FormValues = z.infer<typeof formSchema>;