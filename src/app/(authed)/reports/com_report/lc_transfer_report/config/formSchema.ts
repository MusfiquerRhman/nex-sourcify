import z from 'zod';

// Define the form fields schema using Zod
export const LcTransferReportFormSchema = z
.object({
    buyer_id: z.string().min(1, 'Buyer Id is required'),
    lcId: z.string().min(1, 'LC/SC Id is required'),
    factoryId: z.number().optional(),
})

export type LcTransferReportFormValues = z.infer<typeof LcTransferReportFormSchema>;
