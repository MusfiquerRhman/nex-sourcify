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
    buyer_id: z.string(),
    factory_id: z.string(),
    sales_contract_no: z.string().optional(),
    sales_contract_date: z.string().optional(),
    buyer_bank_id: z.string(),
    factory_bank_id: z.string(),
    rdl_bank_id: z.string(),
    negotiation_bank_id: z.string(),
    partial_shipment: z.boolean(),
    destination_id: z.string(),
    freight_terms_id: z.string(),
    consignee_ids: z.array(z.string()).optional(),
    company_id: z.string(),
    contact_person_id: z.string(),
    details: z.array(salesContractDetailsSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;