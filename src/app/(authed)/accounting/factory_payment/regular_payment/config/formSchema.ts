import z from 'zod';

export const FactoryPaymentDetails = z.object({
    db_id: z.string().optional(),
    factory_name: z.string().optional(),
    factory_invoice_id: z.string(),
    factory_invoice_no: z.string().optional(),
    factory_fdbc_no: z.string().min(1, "Factory FDBC No is required"),
    invoice_date: z.string().optional(),
    invoice_quantity: z.string().optional(),
    invoice_value: z.string().optional(),
    paid_amount: z.number().optional(),
    factory_payment_no: z.string().optional(),
    is_cross_paid: z.boolean().optional(),
    payment_date: z.string().optional(),
})

export type FactoryPaymentDetailsFormValues = z.infer<typeof FactoryPaymentDetails>;

// Define the form fields schema using Zod
export const FactoryPaymentFormSchema = z.object({
    db_id: z.string().optional(),
    term_name: z.string().optional(),
    fdbc_no: z.string().optional(),
    realization_date: z.string().optional(),
    rdl_invoice_value: z.string().optional(),
    realized_amount: z.string().optional(),
    factory_paid_amount: z.string().optional(),
    remarks: z.string().optional(),
    details: z.array(FactoryPaymentDetails).optional(),
});

export type FactoryPaymentFormValues = z.infer<typeof FactoryPaymentFormSchema>;
