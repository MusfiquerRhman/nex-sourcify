import z from 'zod';

export const TNAPlanningDetails = z.object({
    db_id: z.string().optional(),
    tna_action: z.string().optional(),
    plan_date: z.string().optional(),
    actual_date: z.string().optional(),
});

export type TNAPlanningDetailsFormValues = z.infer<typeof TNAPlanningDetails>;

// Define the form fields schema using Zod
export const tnaPlanningSchema = z.object({
    db_id: z.string().optional(),
    factory_invoice: z.string().optional(),
    tna_template: z.string().optional(),
    details: z.array(TNAPlanningDetails).optional(),
});

export type TNAPlanningFormValues = z.infer<typeof tnaPlanningSchema>;
