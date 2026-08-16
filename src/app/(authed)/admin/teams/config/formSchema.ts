import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    team_name: z.string().min(2, "Team name must be at least 2 characters long"),
    buyer_id: z.string().min(1, "Buyer is required"),
});

export type FormValues = z.infer<typeof formSchema>;