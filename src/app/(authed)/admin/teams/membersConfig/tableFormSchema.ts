import z from "zod";

// Define the form schema using Zod
export const tableFormSchema = z.object({
    db_id: z.string().optional(),
    user_id: z.string().min(1, "Member is required"),
    department_name: z.string().optional(),
    level_name: z.string().optional(),
});

export type TableFormValues = z.infer<typeof tableFormSchema>;