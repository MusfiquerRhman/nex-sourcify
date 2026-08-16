import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    buyer_id: z.string().min(1, "Buyer is required"),
    buffer: z.number().min(1, "Buffer must be at least 1 day"),
});

export type FormValues = z.infer<typeof formSchema>;