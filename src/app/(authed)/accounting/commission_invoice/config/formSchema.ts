import z from 'zod';

// Define the form fields schema using Zod
export const CommissionInvoiceSchema = z.object({
    db_id: z.string().optional(),
    term_id: z.number().min(1, "Term is required"),
    buyer_id: z.number().min(1, "Buyer is required"),
    invoice_date: z.string().min(1, "Submission Date is required"),
    ref_no: z.string().optional(),
    lc_sc_id: z.string().min(1, "FDBC/TT Value is required"),
    sc_lc_no: z.string().optional(),
    fdbc_rdl_invoice_id: z.string().min(1, "FDBC/TT Date is required"),
    fdbc_rdl_invoice_no: z.string().optional(),
    company_bank_id: z.number().min(1, "LC/SC is required"),
});

export type CommissionInvoiceFormValues = z.infer<typeof CommissionInvoiceSchema>;
