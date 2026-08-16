import z from "zod";

export const salesContractDetailsSchema = z.object({
    db_id: z.string().optional(),
    order_id: z.string().min(1, "Order ID is required"),
    buyer_name: z.string().optional(),
    season_name: z.string().optional(),
});

export type SalesContractDetailsValues = z.infer<typeof salesContractDetailsSchema>;

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.string().optional(),
    factory_id: z.string(),
    sales_contract_id: z.string(),
    amendment_date: z.string().optional(),
    amendment_no: z.string().optional(),
    remarks: z.string().min(1, "Remarks are required"),
    details: z.array(salesContractDetailsSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;