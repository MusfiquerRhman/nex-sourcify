import { order_status } from '@prisma/client';
import z from 'zod';

import { styleFormSchema as styleSchema } from '../styleConfig/tableFormSchema';

// Define the form fields schema using Zod
export const orderFormSchema = z.object({
    order: z.object({
        db_id: z.string().optional(),
        ref_no: z.string().optional(),
        buyer_id: z.string().min(1, "Buyer is required"),
        season_id: z.string().min(1, "Season is required"),
        fob_type_id: z.string().min(1, "FOB Type is required"),
        order_date: z.string().min(1, "Order Date is required"),
        team_id: z.string().min(1, "Team is required"),
        brand_id: z.string().min(1, "Brand is required"),
        department_id: z.string().min(1, "Department is required"),
        factory_id: z.string().min(1, "Factory is required"),
        secondary_currency_id: z.string().optional(),
        currency_rate: z.number().gt(0, 'Currency rate must be greater than 0').optional(),
        remarks: z.string().optional(),
        status: z.nativeEnum(order_status).optional(),
        styles: z.array(styleSchema).optional(),
    }),
}).superRefine((data, ctx) => {
  const orderDate = new Date(data.order.order_date);

  data.order.styles?.forEach((style, styleIndex) => {
    style.shipments?.forEach((shipment, shipmentIndex) => {
      const etdDate = new Date(shipment.etd_date);

      if (etdDate <= orderDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["order", "styles", styleIndex, "shipments", shipmentIndex, "etd_date"],
          message: "ETD date must be later than Order Date",
        });
      }
    });
  });
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
