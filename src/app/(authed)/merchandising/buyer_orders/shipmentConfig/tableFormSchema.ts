import z from "zod";
import { colorSchema } from "../colorConfig/tableFormSchema";

export const shipmentSchema = z.object({
    db_id: z.string().optional(),
    delivery_no: z.number().optional(),
    buyer_po: z.string().min(1, "Buyer PO is required"),
    etd_date: z.string().min(1, "ETD date is required"),
    handover_date: z.string().min(1, "Handover date is required"),
    destination_id: z.string().min(1, "Destination Port is required"),
    shipment_mode: z.string().min(1, "Shipment Mode is required"),
    payment_term_id: z.string().min(1, "Payment Term is required"),
    size_id: z.string().min(1, "Size Range is required"),
    lot_quantity: z.number().min(1, "Quantity must be at least 1"),
    fob_rate: z.number().gt(0, "FOB must be greater than 0"),
    rdl_fob_usd: z.any().optional(),
    rdl_value: z.any().optional(),
    ex_factory_exists: z.boolean().optional(),
    rdl_value_usd: z.any().optional(),
    colors: z.array(colorSchema),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;