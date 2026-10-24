import z from 'zod';

const shipmentSchema = z.object({
    db_id: z.string().optional(),
	style: z.string().optional(),
    buyer_po: z.string().optional(),
    destination: z.string().optional(),
    size: z.string().optional(),
    order_quantity: z.string().optional(),
    fob_rate: z.string().optional(),
    rdl_value: z.string().optional(),
    early_settlement_charge: z.number().optional(),
    effective_rdl_fob: z.string().optional(),
    effective_rdl_value: z.string().optional(),
    factory_rate: z.string().optional(),
    factory_value: z.string().optional(),
    commission_percentage: z.string().optional(),
    effective_commission_percentage: z.string().optional(),
    commission_value: z.string().optional(),
    effective_commission: z.string().optional(),
    dhaka_commission_percentage: z.string().optional(),
    effective_dhaka_commission_percentage: z.string().optional(),
    dhaka_value: z.string().optional(),
    effective_dhaka_value: z.string().optional(),
    overseas_commission_percentage: z.string().optional(),
    overseas_value: z.string().optional(),
    effective_overseas_value: z.string().optional(),
    other_commission_percentage: z.string().optional(),
    other_value: z.string().optional(),
    effective_other_value: z.string().optional(),
    symbol: z.string().optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export const earlySettlementFormSchema = z.object({
	db_id: z.string().optional(),
	order_id: z.string().min(1, "Order is required"),
	buyer_id: z.number().min(1, "Buyer is required"),
	remarks: z.string().optional(),
	pos: z.array(shipmentSchema).optional(),
});

export type EarlySettlementFormValues = z.infer<typeof earlySettlementFormSchema>;