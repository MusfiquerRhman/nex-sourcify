import z from 'zod';

// Define the form fields schema using Zod
export const OrderSummaryReportFormSchema = z.object({
    base: z.enum(['ACTUAL EXFACTORY', 'EXFACTORY', 'ETD', 'HANDOVER'], { required_error: "Base is required" }),
    from_date: z.string().min(1, "From Date is required"),
    to_date: z.string().min(1, "To Date is required"),
    buyer_ids: z.array(z.number()).optional(),
    factory_ids: z.array(z.string()).optional(),
    brand_ids: z.array(z.string()).optional(),
    department_ids: z.array(z.string()).optional(),
    team_id: z.array(z.string()).optional(),
    season_ids: z.array(z.string()).optional(),
});

export type OrderSummaryReportFormValues = z.infer<typeof OrderSummaryReportFormSchema>;
