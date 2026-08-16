import z from 'zod';

export const RDLInvoiceDetails = z.object({
    db_id: z.string().optional(),
    rdl_invoice_id: z.string().min(1, "Exfactory Shipment is required"),
    rdl_invoice_no: z.string().min(1, "Exfactory Shipment is required"),
    invoice_value: z.string().optional(),
    proceed_value: z.number().optional(),
})

export type RDLInvoiceDetailsFormValues = z.infer<typeof RDLInvoiceDetails>;

// Define the form fields schema using Zod
export const ProceedRealizationFormSchema = z.object({
    db_id: z.string().optional(),
    term_id: z.number().min(1, "Term is required"),
    buyer_id: z.number().min(1, "Buyer is required"),
    proceed_date: z.string().min(1, "Proceed Date is required"),
    document_submission_id: z.string().min(1, "FDBC No is required"),
    document_submission_no: z.string().optional(),
    lc_sc_no: z.string().optional(),
    bank_charge: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    document_charge: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    discount_charge: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    invoice_value: z.string().optional(),
    details: z.array(RDLInvoiceDetails).optional(),
});

export type ProceedRealizationFormValues = z.infer<typeof ProceedRealizationFormSchema>;
