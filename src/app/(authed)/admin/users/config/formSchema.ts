import z from "zod";

// Define the form schema using Zod
export const formSchema = z.object({
    first_name: z.string().min(4, "Name must be at least 4 characters long"),
    last_name: z.string().optional(),
    user_id: z.string().min(4, "Username must be at least 4 characters long"),
    department_id: z.number({invalid_type_error: "Select a department"}).min(1, 'Department is required'),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters long"),
    phone_no: z.string().min(1, 'Phone no is required').refine(
        (val) => !val || val.length >= 11,
        { message: "Phone number must be at least 11 characters long" }
    ),
    email: z.string().min(1, 'Email is required').refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
    ),
    level_id: z.number({invalid_type_error: "Select a level"}).min(1, 'Level is required'),
    is_active: z.boolean(),
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type FormValues = z.infer<typeof formSchema>;
