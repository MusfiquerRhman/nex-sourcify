import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Office name must be at least 2 characters long"),
    phone_no: z.string().optional().refine(
        (val) => !val || val.length >= 11,
        { message: "Phone number must be at least 11 characters long" }
    ),
    email: z.string().optional().refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
    office_address: z.string().optional(),
    factory_address: z.string().optional(),
    prefix: z.string().min(1, "Prefix is required").max(5, "Prefix must be at most 5 characters long"),
    contact_person: z.string().optional(),
    website: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;