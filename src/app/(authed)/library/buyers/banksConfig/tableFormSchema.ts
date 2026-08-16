import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    db_id: z.number().optional(),
    bank_id: z.string().min(1, "Bank is required"),
    branch_name: z.string().min(1, "Branch Name is required"),
    account_no: z.string().min(1, "Account Number is required"),
    account_name: z.string().min(1, "Account Name is required"),
    swift: z.string().min(1, "SWIFT Code is required"),
    address: z.string().min(1, "Address is required"),
});

export type FormValues = z.infer<typeof formSchema>;