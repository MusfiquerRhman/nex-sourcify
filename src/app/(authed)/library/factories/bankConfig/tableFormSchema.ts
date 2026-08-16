import z from "zod";

// Define the form schema using Zod

export const formSchema = z.object({
    db_id: z.number().optional(),
    bank_id: z.string().min(1, "Bank is required"),
    branch_name: z.string().min(2, "Branch name must be at least 2 characters long"),
    account_no: z.string().min(5, "Account number must be at least 5 characters long"),
    account_name: z.string().min(2, "Account name must be at least 2 characters long"),
    swift_code: z.string().optional(),
    address: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;