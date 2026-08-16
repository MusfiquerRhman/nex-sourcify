import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.number().optional(),
    description: z.string().min(1, "Late Policy description can not be empty"),
});

export type FormValues = z.infer<typeof formSchema>;