import z from "zod";

export const crossPayReportFormSchema = z.object({
    buyer_ids: z.array(z.number()).optional(),
    factory_ids: z.array(z.string()).optional(),
    cross_pay_from: z.string().optional(),
    cross_pay_to: z.string().optional(),
    factory_pay_from: z.string().optional(),
    factory_pay_to: z.string().optional(),
}).superRefine((values, ctx) => {
    if (values.cross_pay_from && !values.cross_pay_to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cross_pay_to"],
            message: "To Date is required",
        });
    }

    if (!values.cross_pay_from && values.cross_pay_to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cross_pay_from"],
            message: "From Date is required",
        });
    }

    if (values.cross_pay_from && values.cross_pay_to && values.cross_pay_from > values.cross_pay_to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cross_pay_to"],
            message: "To Date must be on or after From Date",
        });
    }

    if (values.factory_pay_from && !values.factory_pay_to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["factory_pay_to"],
            message: "To Date is required",
        });
    }

    if (!values.factory_pay_from && values.factory_pay_to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["factory_pay_from"],
            message: "From Date is required",
        });
    }

    if (values.factory_pay_from && values.factory_pay_to && values.factory_pay_from > values.factory_pay_to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["factory_pay_to"],
            message: "To Date must be on or after From Date",
        });
    }
});

export type CrossPayReportFormValues = z.infer<
    typeof crossPayReportFormSchema
>;