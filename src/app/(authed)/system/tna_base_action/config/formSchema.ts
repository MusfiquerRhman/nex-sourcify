import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    buyer_id: z.string().min(1, "Buyer is required"),
    action_id: z.string().min(1, "TNA Action is required"),
});

export type FormValues = z.infer<typeof formSchema>;