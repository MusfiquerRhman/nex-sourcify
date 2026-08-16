import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(1, "FOB type is required"),
});

export type FormValues = z.infer<typeof formSchema>;