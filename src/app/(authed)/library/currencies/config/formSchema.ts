import z from "zod";

export const formSchema = z.object({
    name: z.string().min(1, "Currency name is required"),
    currency_code: z.string().optional(),
    symbol: z.string().min(1, "Currency symbol is required"),
});

export type FormValues = z.infer<typeof formSchema>;