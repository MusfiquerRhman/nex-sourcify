import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.number().optional(),
    buyer_id: z.number().min(1, 'Buyer is required'),
    buyer_name: z.string().optional(),
    other_percentage: z.number().min(0, "Percentage can't be less than zero"),
    overseas_percentage: z.number().min(0, "Percentage can't be less than zero"),
});

export type FormValues = z.infer<typeof formSchema>;