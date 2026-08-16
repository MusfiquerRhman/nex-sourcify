import z from "zod";
import { shipmentSchema } from "../shipmentConfig/tableFormSchema";

export const styleFormSchema = z.object({
    db_id: z.string().optional(),
    product_type_id: z.string().min(1, "Product Type is required"),
    product_id: z.string().min(1, "Product is required"),
    style: z.string().min(1, "Style is required"),
    fabric_id: z.string().min(1, "Fabric is required"),
    supplier_id: z.string().min(1, "Fabric Supplier is required"),
    photo_url: z.string().optional(),
    file_size: z.number().optional(),
    order_quantity: z.number().min(1, "Order Quantity must be at least 1").nullish()
        .refine(val => val === undefined|| val === null || val > 0 , {
            message: "Order Quantity must be greater than 0",
        }),
    shipments: z.array(shipmentSchema).optional(),
})
.superRefine((style, ctx) => {
  if (!style.order_quantity) return;

  let runningTotal = 0;

  style?.shipments?.forEach((shipment, shipmentIndex) => {
    shipment.colors.forEach((color) => {
      runningTotal += color.quantity;

      if (runningTotal > style.order_quantity!) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            "shipments",
            shipmentIndex,
            "lot_quantity"
          ],
          message: `Exceeds order quantity (${style.order_quantity})`,
        });
      }
    });
  });
});

export type StyleFormValues = z.infer<typeof styleFormSchema>;