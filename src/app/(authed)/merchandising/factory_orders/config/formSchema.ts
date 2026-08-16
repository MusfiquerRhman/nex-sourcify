import z from 'zod';

const shipmentSchema = z.object({
    db_id: z.string().optional(),
    shipment_id: z.string().optional(),
    delivery_no: z.number().optional(),
    buyer_po: z.string().optional(),
    exfactory_date: z.string().min(1, "Exfactory Date is required"),
    etd_date: z.string().optional(),
    handover_date: z.string().optional(),
    destination_id: z.string().optional(),
    shipment_mode: z.string().optional(),
    payment_term_id: z.string().optional(),
    size_id: z.string().optional(),
    lot_quantity: z.number().optional(),
    factory_fob: z.number().gt(0, "Factory FOB Rate can't be zero"),
    factory_value: z.string().optional(),
    ex_factory_exists: z.boolean().optional(),
    transfer_rate: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    transfer_value: z.string().optional(),
    colors: z.string().optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export const styleFormSchema = z.object({
    db_id: z.string().optional(),
    product_type_name: z.string().optional(),
    product_name: z.string().optional(),
    style: z.string().optional(),
    fabric_name: z.string().optional(),
    supplier_name: z.string().optional(),
    order_quantity: z.number().optional(),
    shipments: z.array(shipmentSchema).optional(),
})

export type StyleFormValues = z.infer<typeof styleFormSchema>;

export const factoryOrderFormSchema = z.object({
    factoryOrder: z.object({
        db_id: z.string().optional(),
        order_id: z.string().min(1, "Order ID is required"),
        factory_name: z.string().optional(),
        season_name: z.string().optional(),
        buyer_name: z.string().optional(),
        order_date: z.string().optional(),
        currency_id: z.string().optional(),
        currency_rate: z.number().optional(),
        factory_order_date: z.string().min(1, "Factory Order Date is required"),
        department: z.string().optional(),
        remarks: z.string().optional(),
        styles: z.array(styleFormSchema).optional(),
    }),
});

export type FactoryOrderFormValues = z.infer<typeof factoryOrderFormSchema>;