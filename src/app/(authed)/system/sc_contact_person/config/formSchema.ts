import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters long"),
    contact_number: z.string().min(11, "Contact number must be at least 11 characters long"),
    pabx: z.string().optional(),
    ext: z.number().optional(),
    email: z.string().min(1, 'Email in mandatory').refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
});

export type FormValues = z.infer<typeof formSchema>;