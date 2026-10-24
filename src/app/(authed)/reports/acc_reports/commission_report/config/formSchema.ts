import z from "zod";

export const commissionDistributionReportFormSchema = z.object({
    from_date: z.string().min(1, "From Date is required"),
    to_date: z.string().min(1, "To Date is required"),
}).refine((values) => values.from_date <= values.to_date, {
    path: ["to_date"],
    message: "To Date must be on or after From Date",
});

export type CommissionDistributionReportFormValues = z.infer<
    typeof commissionDistributionReportFormSchema
>;