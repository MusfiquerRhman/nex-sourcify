import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "TNA Action name must be at least 2 characters long"),
    department_id: z.string().min(1, "Department is required"),
    lead_time: z.number().min(0, "Lead Time must be a non-negative number"),
    alert_before: z.number().min(0, "Alert Before must be a non-negative number"),
});

export type FormValues = z.infer<typeof formSchema>;