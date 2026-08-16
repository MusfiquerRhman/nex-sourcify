import z from "zod";

export const lcShipmentSchema = z.object({
    db_id: z.string().optional(),
    shipment_details_id: z.string().optional(),
    style: z.string().optional(),
    po: z.string().optional(),
    factory_name: z.string().optional(),
    exfactory_date: z.string().optional(),
    destination: z.string().optional(),
    quantity: z.string().optional(),
    rdl_fob: z.string().optional(),
    rdl_value: z.string().optional(),
    factory_transfer_value: z.string().optional(),
    checked: z.boolean().optional(),
});

export type LCShipmentValue = z.infer<typeof lcShipmentSchema>;

export const lcOrdersSchema = z.object({
    db_id: z.string().optional(),
    order_id: z.string().min(1, "Order ID is required"),
    pi_no: z.string().optional(),
    po_no: z.string().optional(),
    shipments: z.array(lcShipmentSchema).optional(),
});

export type LCOrdersValue = z.infer<typeof lcOrdersSchema>;

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(1, "Buyer is required"),
    lc_no: z.string().min(1, "LC Number is required"),
    lc_open_date: z.string(),
    lc_received_date: z.string(),
    company_id: z.number().min(1, "Company is required"),
    lc_quantity: z.number().min(0, "LC Quantity must be a positive number"),
    lc_value: z.number().min(0, "LC Value must be a positive number"),
    currency_id: z.number().min(1, "Currency is required"),
    rdl_bank_id: z.number(),
    buyer_bank_id: z.number(),
    lc_status: z.boolean(),
    latest_shipment_date: z.string().optional(),
    expire_date: z.string(),
    remarks: z.string().optional(),
    order_lc_quantity: z.string().optional(),
    order_lc_value: z.string().optional(),
    details: z.array(lcOrdersSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;