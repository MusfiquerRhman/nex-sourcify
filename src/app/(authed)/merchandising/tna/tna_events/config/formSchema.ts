import z from "zod";

export const actionForm = z.object({
    id: z.string(),
    checked: z.boolean().optional(),
    order_ref: z.string().optional(),
    style: z.string().optional(),
    po: z.string().optional(),
    template_name: z.string().optional(),
    action_name: z.string().optional(),
    plan_date: z.string().optional(),
    revise_date: z.string().optional(),
    actual_date: z.string().optional().refine((val) => {
        if (!val) return true; // optional field
        const inputDate = new Date(val);
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        return inputDate >= threeDaysAgo;
    }, {
      message: "Revise date cannot be more than 3 days behind today",
    }),
    buyer_name: z.string().optional(),
    factory_name: z.string().optional(),
    destination_name: z.string().optional(),
});

export type ActionFormValues  = z.infer<typeof actionForm>;

export const formSchema = z.object({
    from_date: z.string().min(1, "Order Date is required"),
    to_date: z.string().min(1, "To date is required"),
    event_ids: z.array(z.number()).optional(),
    actions: z.array(actionForm).min(1, "At least one action is required"),
});

export type FormValues = z.infer<typeof formSchema>;