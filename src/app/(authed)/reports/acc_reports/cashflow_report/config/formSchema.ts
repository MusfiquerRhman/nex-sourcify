import z from "zod";

export const cashflowReportFormSchema = z.object({
    buyer_ids: z.array(z.number().int().positive()).optional(),
    from_date: z.string().date("Enter a valid From Date").or(z.literal("")).optional(),
    to_date: z.string().date("Enter a valid To Date").or(z.literal("")).optional(),
}).refine((values) => !values.from_date || !values.to_date || values.from_date <= values.to_date, {
    path: ["to_date"],
    message: "To Date must be on or after From Date",
});

export type CashflowReportFormValues = z.infer<typeof cashflowReportFormSchema>;
