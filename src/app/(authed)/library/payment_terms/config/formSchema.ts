import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    terms_id: z.string().min(1, "Terms is required"),
    tenor: z.number().min(0, "Tenor must be a non-negative number"),
    term_description: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;