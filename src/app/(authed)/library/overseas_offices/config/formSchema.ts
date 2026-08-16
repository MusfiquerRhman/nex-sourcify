import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Office name must be at least 2 characters long"),
    phone_no: z.string().optional().refine(
        (val) => !val || val.length >= 11,
        { message: "Phone number must be at least 11 characters long" }
    ),
    email_address: z.string().optional().refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
    currency_id: z.string().optional(),
    country_id: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    zip: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;