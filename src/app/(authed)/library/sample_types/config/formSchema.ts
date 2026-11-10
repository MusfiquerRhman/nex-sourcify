import z from "zod";

export const formSchema = z.object({
    name: z.string().trim().min(2, "Sample type name must be at least 2 characters long").max(50, "Sample type name must be at most 50 characters long"),
});

export type FormValues = z.infer<typeof formSchema>;
