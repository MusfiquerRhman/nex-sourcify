import z from 'zod';

// Define the form fields schema using Zod
export const productionPlanFormSchema = z.object({
    db_id: z.string().optional(),
    color_name: z.string().optional(),
    po_no: z.string().optional(),
    order_quantity: z.number().optional(),
    size: z.string().optional(),
    cutting_date: z.string().date().or(z.literal('')).optional(),
    sewing_date: z.string().date().or(z.literal('')).optional(),
    finishing_date: z.string().date().or(z.literal('')).optional(),
    plan_inspection_date: z.string().date().or(z.literal('')).optional(),
});

export type ProductionPlanValues = z.infer<typeof productionPlanFormSchema>;

export const approvalStatusFormSchema = z.object({
    db_id: z.string().optional(),
    status_name: z.string().optional(),
    approval_status: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
});

export type ApprovalFormValues = z.infer<typeof approvalStatusFormSchema>;

export const preProductionMeetingFormSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number({
        required_error: "Buyer is required",
        invalid_type_error: "Buyer is required"
    }).int().positive("Buyer is required"),
    factory_id: z.number({ 
        required_error: "Factory is required", 
        invalid_type_error: "Factory is required" 
    }).int().positive("Factory is required"),
    order_id: z.string().uuid("Order is required"),
    style_id: z.string().uuid("Style is required"),
    first_shipment_date: z.string().optional(),
    item: z.string().optional(),
    fabric_description: z.string().optional(),
    required_gsm: z.string().optional(),
    order_quantity: z.string().optional(),
    daily_production_plan: z.number({ 
        required_error: "Daily production plan is required", 
        invalid_type_error: "Daily production plan is required" 
    })
        .int("Daily production plan must be a whole number")
        .positive("Daily production plan must be greater than zero")
        .max(2147483647, "Daily production plan is too large"),
    productionPlans: z.array(productionPlanFormSchema).optional(),
    approvalStatus: z.array(approvalStatusFormSchema).optional(),
});

export type PreProductionFormValues = z.infer<typeof preProductionMeetingFormSchema>;

export const editPreProductionMeetingFormSchema = preProductionMeetingFormSchema.pick({
    daily_production_plan: true,
}).extend({
    meeting_date: z.string().date().or(z.literal('')),
    overall_comments: z.string(),
    factory_name: z.string().optional(),
    ref_no: z.string().optional(),
    style: z.string().optional(),
    first_shipment_date: z.string().optional(),
    item: z.string().optional(),
    fabric_description: z.string().optional(),
    required_gsm: z.string().optional(),
    order_quantity: z.number().optional(),
    size_range: z.string().optional(),
    color_names: z.string().optional(),
    productionPlans: z.array(productionPlanFormSchema.extend({ db_id: z.string().uuid() })),
    approvalStatus: z.array(approvalStatusFormSchema.extend({ db_id: z.string().uuid() })),
});

export type EditPreProductionFormValues = z.infer<typeof editPreProductionMeetingFormSchema>;
