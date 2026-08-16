import z from 'zod';

export const commissionDistributionDetails = z.object({
    db_id: z.string(),
    style: z.string().optional(),
    po: z.string().optional(),
    destination: z.string().optional(),
    size: z.string().optional(),
    order_quantity: z.number().optional(),
    rdl_fob: z.string().optional(),
    factory_fob: z.string().optional(),
    rdl_value: z.string().optional(),
    factory_value: z.string().optional(),
    commission_value: z.string().optional(),
    margin_per_piece: z.string().optional(),
    commission_percentage: z.string().optional(),
    dhaka_commission_percentage: z.number()
        .gt(-0.001, "Dhaka commission percentage must be non-negative")
        .max(100, "Dhaka commission percentage cannot exceed 100"),
    dhaka_commission_amount: z.string().optional(),
    overseas_commission_percentage: z.number()
        .min(0, "Overseas commission percentage cannot be negative")
        .max(100, "Overseas commission percentage cannot exceed 100"),
    overseas_commission_amount: z.string().optional(),
    others_commission_percentage: z.number()
        .min(0, "Others commission percentage cannot be negative")
        .max(100, "Others commission percentage cannot exceed 100"),
    others_commission_amount: z.string().optional(),
}).superRefine((data, ctx) => {
    const total = data.dhaka_commission_percentage +
        (data.overseas_commission_percentage ?? 0) +
        (data.others_commission_percentage ?? 0);
    
    const commissionPercentage = parseFloat(data.commission_percentage ?? "0");

    if (Math.abs(total - commissionPercentage) > 0.01) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Sum of Dhaka, Overseas, and Others must equal total Commission Percentage",
            path: ["dhaka_commission_percentage"] // You can specify the path to the relevant fields, 
        });
    }
});

export type CommissionDistributionDetailsFormValues = z.infer<typeof commissionDistributionDetails>;

// Define the form fields schema using Zod
export const commissionDistribution = z.object({
    db_id: z.string().optional(),
    order_id: z.string().min(1, "Order ID is required"),
    distribution_date: z.string().optional(),
    remarks: z.string().optional(),
    details: z.array(commissionDistributionDetails).optional(),
});

export type CommissionDistributionFormValues = z.infer<typeof commissionDistribution>;
