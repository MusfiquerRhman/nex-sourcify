import z from 'zod';

export const CrossPaymentDetails = z.object({
    db_id: z.string().optional(),
    factory_payment_detail_id: z.string().optional(),
    factory_invoice_no: z.string().optional(),
    factory_name: z.string().optional(),
    factory_payment_no: z.string().optional(),
    payment_date: z.string().optional(),
    paid_amount: z.string().optional(),
    regularized: z.string().optional(),
});

export type CrossPaymentDetailsFormValues = z.infer<typeof CrossPaymentDetails>;

export const CrossPaymentFormSchema = z.object({
    details: z.array(CrossPaymentDetails).optional(),
});

export type CrossPaymentFormValues = z.infer<typeof CrossPaymentFormSchema>;