import z from "zod";

export const tnaActionFormSchema = z.object({
    db_id: z.string().optional(),
    action_id: z.string().min(1, "Action is required"),
    days: z.number().min(0, "Days must be a non-negative number"),
    alert_before: z.number().min(0, "Alert before must be a non-negative number"),
});

export type TnaActionFormValues = z.infer<typeof tnaActionFormSchema>;

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.string().optional(),
    template_name: z.string().min(2, "Template name must be at least 2 characters long"),
    buyer_id: z.string().min(1, "Buyer is required"),
    team_id: z.string().min(1, "Team is required"),
    actions: z.array(tnaActionFormSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;