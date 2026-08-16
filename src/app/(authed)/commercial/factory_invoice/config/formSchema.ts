import z from 'zod';

export const FactoryInvoiceDetails = z.object({
    db_id: z.string().optional(),
    exfactory_shipment_id: z.string().min(1, "Exfactory Shipment is required"),
    order_no: z.string().optional(),
    style: z.string().optional(),
    po: z.string().optional(),
    exfactory_date: z.string().optional(),
    destination: z.string().optional(),
    order_quantity: z.number().optional(),
    delivery_quantity: z.number().optional(),
    factory_fob: z.number().optional(),
    factory_value: z.number().optional(),
    checked: z.boolean().optional(),
});

export type FactoryInvoiceDetailsFormValues = z.infer<typeof FactoryInvoiceDetails>;

// Define the form fields schema using Zod
export const FactoryInvoiceFormSchema = z.object({
    db_id: z.string().optional(),
    factory_id: z.number().min(1, "Factory is required"),
    buyer_id: z.number().min(1, "Buyer is required"),
    term_id: z.number().min(1, "Term is required"),
    lc_sc_id: z.string().min(1, "LC/SC is required"),
    invoice_no: z.string().min(1, "Invoice No is required"),
    invoice_date: z.string().min(1, "Invoice Date is required"),
    remarks: z.string().optional(),
    freight_term_id: z.number().min(1, "Freight Term is required"),
    consignee_ids: z.array(z.number()).optional(),
    notifyParties: z.array(z.number()).optional(),
    port_of_loading: z.number().optional(),
    shipment_mode: z.string().optional(),
    discount: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    invoice_quantity: z.string().optional(),
    invoice_value: z.string().optional(),
    total_value: z.string().optional(),
    details: z.array(FactoryInvoiceDetails).optional(),
});

export type FactoryInvoiceFormValues = z.infer<typeof FactoryInvoiceFormSchema>;
