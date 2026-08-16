import z from "zod";

export const tnaActionFormSchema = z.object({
    db_id: z.string().optional(),
    action_name: z.string().optional(),
    buyer_po: z.string().optional(),
    destination_name: z.string().optional(),
    plan_date: z.string().optional(),
    revise_date: z.string().optional().refine((val) => {
      if (!val) return true; // optional field
      const inputDate = new Date(val);
      const today = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);

      return inputDate >= threeDaysAgo;
    }, {
      message: "Revise date cannot be more than 3 days behind today",
    }),
    actual_date: z.string().optional(),
    // responsible_level: z.string().optional(),
    // responsible_person: z.string().optional(),
});

export type TnaActionFormValues  = z.infer<typeof tnaActionFormSchema>;

// Define the form schema using Zod
export const formSchema = z.object({
    tna_template_id: z.string().min(1, "TNA Template is required"),
    buyer_order_id: z.string().min(1, "Buyer order is required"),
    style_id: z.string().min(1, "Style is required"),
    plan_date: z.string().min(1, "Plan Date is required"),  
    buyer_name: z.string().optional(),
    brand_name: z.string().optional(),
    department_name: z.string().optional(),
    factory_name: z.string().optional(),
    season_name: z.string().optional(),
    actions: z.array(tnaActionFormSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;