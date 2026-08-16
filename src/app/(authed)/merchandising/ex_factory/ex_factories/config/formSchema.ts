import { toast } from 'sonner';
import z from 'zod';

export const createExFactoryShipmentSchema = (tolerance: number) =>
	z.object({
		db_id: z.string().optional(),
		shipment_details_id: z.string().optional(),
		style_no: z.string().optional(),
		po_no: z.string().optional(),
		destination: z.string().optional(),
		colors: z.string().optional(),
		lot_quantity: z.string().optional(),
		previous_shipment_quantity: z.string().optional(),
		shipment_quantity: z.number().optional(),
		shipment_mode: z.string().optional(),
		delivery_close: z.boolean().optional(),
		po_close: z.boolean().optional(),
	}).superRefine((data, ctx) => {
		const lotQty = Number(data.lot_quantity || 0);
		const previousQuantity = Number(data.previous_shipment_quantity || 0);

		if (!lotQty || !data.shipment_quantity) return;

		const maxAllowed = lotQty * (1 + (tolerance / 100));

		if (data.shipment_quantity + previousQuantity > Math.floor(maxAllowed)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["shipment_quantity"],
			message: `Shipment Quantity cannot exceed ${Math.floor(maxAllowed)} (including ${tolerance}% tolerance)`,
		});
    }
});

export type ExFactoryShipmentValues = z.infer<ReturnType<typeof createExFactoryShipmentSchema>>;

export const createExFactoryOrderSchema = (tolerance: number) => z.object({
	db_id: z.string().optional(),
	order_id: z.string().min(1, "Order is required"),
	shipments: z.array(
		createExFactoryShipmentSchema(tolerance)
	).optional(),
}).superRefine((data, ctx) => {
	const hasShipmentQty = data.shipments?.some(
		(shipment) => (shipment.shipment_quantity ?? 0) > 0
	);

	if (!hasShipmentQty) {
		toast.error("At least one shipment quantity must be greater than 0");
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["shipments", 0, "shipment_quantity"],
			message: "At least one shipment quantity must be greater than 0",
		});
	}
});

export type ExFactoryOrdersValues = z.infer<ReturnType<typeof createExFactoryOrderSchema>>;

// Define the form fields schema using Zod
export const createExFactoryFormSchema = (tolerance: number) => {
	return z.object({
		exfactory: z.object({
			db_id: z.string().optional(),
			exfactory_no: z.string().optional(),
			payment_type: z.string().min(1, "Payment Type is required"),
			factory_id: z.string().min(1, "Factory is required"),
			buyer_id: z.string().min(1, "Buyer is required"),
			exfactory_date: z.string().min(1, "Ex Factory Date is required"),
			remarks: z.string().optional(),
			orders: z.array(createExFactoryOrderSchema(tolerance)).min(1, "At least one order is required"),
		}),
	})
};

export type ExFactoryFormValues = z.infer<ReturnType<typeof createExFactoryFormSchema>>;