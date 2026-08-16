import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    buyer_name: z.string().min(1, "Buyer name is required"),
    short_name: z.string().min(1, "Short name is required"),
    prefix: z.string().min(1, "Prefix is required").max(10, "Prefix must be at most 10 characters long"),
    address: z.string().optional(),
    phone_no: z.string().optional(),
    email: z.string().optional().refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
    contact_person: z.string().optional(),
    website: z.string().optional(),
    country_id: z.string().optional(),
    overseas_office_id: z.string().optional(),
    paymentTerms: z.array(z.string()).optional(),
    destinations: z.array(z.string()).optional(),
});
    
export type FormValues = z.infer<typeof formSchema>;