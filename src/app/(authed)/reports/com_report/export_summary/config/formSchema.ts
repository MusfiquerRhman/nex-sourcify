import z from 'zod';

// Define the form fields schema using Zod
export const ExportSummaryReportFormSchema = z.object({
    base: z.enum(['LC', 'SC']),
    from_date: z.string().min(1, "From Date is required"),
    to_date: z.string().min(1, "To Date is required"),
    buyer_ids: z.array(z.number()).optional(),
    lcIds: z.array(z.string()).optional(),
});

export type ExportSummaryReportFormValues = z.infer<typeof ExportSummaryReportFormSchema>;
