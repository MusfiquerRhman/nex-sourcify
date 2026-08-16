import z from 'zod';

export const FactoryInvoiceDetails = z.object({
    db_id: z.string().optional(),
    order_no: z.string().optional(),
    style: z.string().optional(),
    po: z.string().optional(),
    factory_invoice_details_id: z.string(),
    shipment_details_id: z.string().optional(),
    order_quantity: z.number().optional(),
    destination_port: z.string().optional(),
    invoice_quantity: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().min(0, "Invoice quantity cannot be negative").optional()
    ) as z.ZodType<number | undefined>,
    previous_quantity: z.number().optional(),
    invoice_fob: z.string().optional(),
    invoice_value: z.string().optional(),
})    
.superRefine((data, ctx) => {
    if (data.invoice_quantity !== undefined && data.order_quantity !== undefined) {
        const remainingQty = data.order_quantity - (data.previous_quantity ?? 0);

        if (data.invoice_quantity > remainingQty) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["invoice_quantity"],
                message: `Invoice quantity cannot exceed remaining quantity (${remainingQty}).`,
            });
        }
    }
});

export type FactoryInvoiceDetailsFormValues = z.infer<typeof FactoryInvoiceDetails>;

export const RDLInvoiceDetails = z.object({
    db_id: z.string().optional(),
    factory_id: z.string().min(1, "Factory is required"),
    factory_invoice_id: z.string().min(1, "Factory is required"),
    factory_invoice_no: z.string().optional(),
    quantity: z.number().optional(),
    factory_value: z.number().optional(),
    factoryInvoiceDetails: z.array(FactoryInvoiceDetails).optional(),
});

export type RDLInvoiceDetailsFormValues = z.infer<typeof RDLInvoiceDetails>;

// Define the form fields schema using Zod
export const RDLInvoiceSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(1, "Buyer is required"),
    term_id: z.number().min(1, "Term is required"),
    lc_sc_id: z.string().min(1, "LC/SC is required"),
    invoice_no: z.string().min(1, "Invoice No is required"),
    invoice_date: z.string().min(1, "Invoice Date is required"),
    invoice_type: z.boolean(),
    pi_no: z.string().optional(),
    container_no: z.string().optional(),
    contact_no: z.string().optional(),
    remarks: z.string().optional(),
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
    details: z.array(RDLInvoiceDetails).optional(),
});

export type RDLInvoiceFormValues = z.infer<typeof RDLInvoiceSchema>;
