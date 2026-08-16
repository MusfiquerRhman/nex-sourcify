import z from 'zod';

// Define the form fields schema using Zod
export const LcScClosingReportFormSchema = z
.object({
    base: z.enum(['LC', 'SC']),
    buyer_id: z.string().min(1, 'Buyer Id is required'),
    lcId: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
})
.refine(
    (data) => (!data.from_date && !data.to_date) || (data.from_date && data.to_date),
    {
        message: 'From date and To date are both required',
        path: ['to_date'],
    }
);

export type LcScClosingReportFormValues = z.infer<typeof LcScClosingReportFormSchema>;
