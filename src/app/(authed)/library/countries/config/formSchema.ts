import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Country name must be at least 2 characters long"),
    country_code: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;