import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters long"),
    country_id: z.number().min(1, "Country is required"),
    currencies_id: z.number().min(1, "Currency is required"),
    email: z.string().optional().refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
    phone_no: z.string().optional().refine(
        (val) => !val || val.length >= 11,
        { message: "Phone number must be at least 11 characters long" }
    ),
    street: z.string().optional(),
    city: z.string().optional(),
    zip_code: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;