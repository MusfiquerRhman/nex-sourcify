import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    buyer_id: z.number().min(1, "Buyer is required"),
    tolerance_percentage: z.number().min(0).max(100),
});

export type FormValues = z.infer<typeof formSchema>;