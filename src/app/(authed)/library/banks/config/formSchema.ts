import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Office name must be at least 2 characters long"),
    country_id: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;