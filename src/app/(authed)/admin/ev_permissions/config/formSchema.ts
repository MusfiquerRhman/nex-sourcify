import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    bd_id: z.number().optional(),
    buyer_id: z.number().min(1, "Buyer is required"),
    user_id: z.string().min(1, "User is required"),
});

export type FormValues = z.infer<typeof formSchema>;