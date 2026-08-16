import z from 'zod';

export const DebitNoteDetails = z.object({
    db_id: z.string().optional(),
    po_no: z.string().optional(),
    exfactory_shipment_id: z.string(),
    factory_invoice_no: z.string().optional(),
    value: z.string().optional(),
});

export type DebitNoteDetailsFormValues = z.infer<typeof DebitNoteDetails>;

// Define the form fields schema using Zod
export const DebitNoteFormSchema = z.object({
    db_id: z.string().optional(),
    term_id: z.number(),
    dn_date: z.string(),
    factory_id: z.number(),
    dn_ref: z.string().optional(),
    buyer_id: z.number(),
    lc_sc_id: z.string(),
    less: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    processing_charges: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    conversion_rate: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    additional_charges: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    remarks: z.string().optional(),
    details: z.array(DebitNoteDetails).optional(),
});

export type DebitNoteFormValues = z.infer<typeof DebitNoteFormSchema>;
