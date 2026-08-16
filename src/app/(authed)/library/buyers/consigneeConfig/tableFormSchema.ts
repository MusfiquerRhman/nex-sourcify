import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.number().optional(),
    consignee_name: z.string().min(1, "Consignee name is required"),
    address: z.string().min(1, "Address is required"),
});

export type FormValues = z.infer<typeof formSchema>;