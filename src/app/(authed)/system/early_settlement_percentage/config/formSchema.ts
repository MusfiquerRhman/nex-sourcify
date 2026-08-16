import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(1, 'Buyer is required'),
    buyer_name: z.string().optional(),
    charge: z.number().min(0, "Charge can't be less than zero"),
});

export type FormValues = z.infer<typeof formSchema>;