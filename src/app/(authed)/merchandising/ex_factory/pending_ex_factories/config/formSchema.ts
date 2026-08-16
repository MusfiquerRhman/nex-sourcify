import z from "zod";

// Define the form schema using Zod
export const PendingExFactorySchema = z.object({
    buyer_id: z.string().min(1, "Buyer name is required"),
    factory_id: z.string().min(1, "Factory name is required"),
    from_date: z.string().min(1, "Order Date is required"),
    to_date: z.string().min(1, "To date is required"),
});

export type FormValues = z.infer<typeof PendingExFactorySchema>;