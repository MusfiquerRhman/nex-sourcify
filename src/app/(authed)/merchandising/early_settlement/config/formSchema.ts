import z from 'zod';

const shipmentSchema = z.object({
    db_id: z.string().optional(),
	style: z.string().optional(),
	buyer_po: z.string().optional(),
	destination: z.string().optional(),
	size: z.string().optional(),
    order_quantity: z.number().optional(),
    fob_rate: z.number().optional(),
    rdl_value: z.number().optional(),
    early_settlement_charge: z.number().optional(),
    effective_rdl_fob: z.number().optional(),
    effective_rdl_value: z.number().optional(),
    factory_rate: z.number().optional(),
    factory_value: z.number().optional(),
    commission: z.number().optional(),
    dhaka_commission: z.number().optional(),
    other_commission: z.number().optional(),
    overseas_commission: z.number().optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export const earlySettlementFormSchema = z.object({
	db_id: z.string().optional(),
	order_id: z.string().min(1, "Order ID is required"),
	buyer_id: z.string().optional(),
	remarks: z.string().optional(),
	pos: z.array(shipmentSchema).optional(),
});

export type EarlySettlementFormValues = z.infer<typeof earlySettlementFormSchema>;