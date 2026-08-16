import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Supplier name must be at least 2 characters long"),
    phone_no: z.string().optional(),  
    email: z.string().optional(),
    country_id: z.string().optional(),
    address: z.string().optional(),
    contact_person: z.string().optional(),
    website: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;