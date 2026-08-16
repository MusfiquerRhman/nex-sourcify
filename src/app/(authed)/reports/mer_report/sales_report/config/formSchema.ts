import z from 'zod';

// Define the form fields schema using Zod
export const SalesReportFormSchema = z.object({
    base: z.enum(['EXFACTORY', 'ETD', 'HANDOVER'], { required_error: "Base is required" }),
    from_date: z.string().min(1, "From Date is required"),
    to_date: z.string().min(1, "To Date is required"),
    buyer_ids: z.array(z.number()).optional(),
    factory_ids: z.array(z.string()).optional(),
    brand_ids: z.array(z.string()).optional(),
    department_ids: z.array(z.string()).optional(),
    product_type_ids: z.array(z.string()).optional(),
    team_id: z.array(z.string()).optional(),
    quantity: z.boolean().optional(),
    rdl_value: z.boolean().optional(),
    factory_value: z.boolean().optional(),
    commission_value: z.boolean().optional(),
});

export type SalesReportFormValues = z.infer<typeof SalesReportFormSchema>;
