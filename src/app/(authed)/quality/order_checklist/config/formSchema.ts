import z from 'zod';
import { technicalCheckSchema } from '~/utils/orderChecklist';
import { sampleChecklistStatusOptions } from '~/utils/sampleChecklist';

// Define the form fields schema using Zod
export const orderChecklistDetailsFormSchema = z.object({
    db_id: z.string().optional(),
    serial_no: z.number().optional(),
    document_details: z.string().min(1, "Document Details is required"),
    technical_check: technicalCheckSchema,
    technical_remarks: z.string().optional(),
    technical_check_date: z.string().date().or(z.literal('')),
    qa_check: z.boolean(),
    qa_remarks: z.string().optional(),
    qa_check_date: z.string().date().or(z.literal('')),
}).superRefine((detail, ctx) => {
    if (detail.technical_check === 1 && !detail.technical_check_date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['technical_check_date'], message: 'Technical check date is required' });
    }

    if (detail.qa_check && !detail.qa_check_date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['qa_check_date'], message: 'QA check date is required' });
    }
});

export type OrderFormDetailsValues = z.infer<typeof orderChecklistDetailsFormSchema>;

export const orderChecklistFormSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().int().positive("Buyer is required"),
    order_id: z.string().uuid("Order is required"),
    style_id: z.string().uuid("Style is required"),
    po_id: z.string().uuid("PO is required"),
    status: z.union([
        z.literal(sampleChecklistStatusOptions[0].value),
        z.literal(sampleChecklistStatusOptions[1].value),
        z.literal(sampleChecklistStatusOptions[2].value),
    ], { errorMap: () => ({ message: "Select a status" }) }),
    factory_name: z.string().optional(),
    details: z.array(orderChecklistDetailsFormSchema).optional(),
})

export type OrderChecklistFormValues = z.infer<typeof orderChecklistFormSchema>;
