import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    name: z.string().min(2, "Courier name must be at least 2 characters long"),
    phone_no: z.string().optional(),
    email: z.string().optional().refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
    contact_person: z.string().optional(),
    website: z.string().optional().refine(
        (val) => !val || val === "" || /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/.test(val),
        { message: "Invalid website URL" }
    ),
    address: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;