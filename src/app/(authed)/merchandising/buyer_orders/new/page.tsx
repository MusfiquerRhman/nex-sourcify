'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useBuyerOrderForm } from "../config/useBuyerOrderForm";
import type { shipment_modes } from "@prisma/client";
import StylesDetails from "../components/styleComponents/stylesDetails";
import { useRouter } from "next/navigation";

const NewBuyerOrderPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useBuyerOrderForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addBuyerOrder = api.buyerOrders.addBuyerOrder.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer Order added successfully!");
            await utils.buyerOrders.getBuyerOrders.invalidate();
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (buyerOrderData) => {
        try {
            setIsLoading(true);

            const payload = {
                buyer_id: Number(buyerOrderData.order.buyer_id),
                season_id: Number(buyerOrderData.order.season_id),
                fob_type_id: Number(buyerOrderData.order.fob_type_id),
                order_date: new Date(buyerOrderData.order.order_date),
                team_id: Number(buyerOrderData.order.team_id),
                brand_id: Number(buyerOrderData.order.brand_id),
                department_id: Number(buyerOrderData.order.department_id),
                factory_id: Number(buyerOrderData.order.factory_id),
                secondary_currency_id: buyerOrderData.order.secondary_currency_id 
                    ? Number(buyerOrderData.order.secondary_currency_id) : undefined,
                currency_rate: buyerOrderData.order.currency_rate,
                remarks: buyerOrderData.order.remarks,
                status: buyerOrderData.order.status,
                styleData: buyerOrderData?.order?.styles?.map((style, styleIndex) => ({
                    ...style,
                    serial: styleIndex + 1,
                    product_type_id: Number(style.product_type_id),
                    product_id: Number(style.product_id),
                    fabric_id: Number(style.fabric_id),
                    supplier_id: Number(style.supplier_id),
                    order_quantity: style.order_quantity ?? undefined,
                    shipments: style?.shipments?.map((shipment, shipmentIndex) => ({
                        delivery_no: shipmentIndex + 1,
                        buyer_po: shipment.buyer_po,
                        etd_date: new Date(shipment.etd_date),
                        handover_date: new Date(shipment.handover_date),
                        destination_id: Number(shipment.destination_id),
                        shipment_mode: shipment.shipment_mode as shipment_modes,
                        size_id: Number(shipment.size_id),
                        fob_rate: shipment.fob_rate,
                        payment_term_id: Number(shipment.payment_term_id),
                        colors: shipment.colors.map((color) => ({
                            color_id: Number(color.color_id),
                            quantity: color.quantity,
                        }))
                    })),
                })),
                ref_no: buyerOrderData.order.ref_no,
            };

            const addedOrder = await addBuyerOrder.mutateAsync(payload);

            if ( !addedOrder?.order ) {
                throw new Error('Failed to retrieve the added order details.');
            }

            router.push(`/merchandising/buyer_orders/edit/${addedOrder.order?.id}`);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Buyer Order: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });


    return (
        <Wrapper heading='Add Buyer Order' >
            <Form 
                name='order'
                fields={formFields} 
                buttonLabel="Add New Buyer Order" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError.order ?? {}}
                error={error}
                control={control}
            />

            <StylesDetails 
                methods={methods}
                validationError={validationError.order ?? {}}
                disabled={isLoading}
            />

            {/* Shipment Portal anchor */}
            <div id='shipment_details_portal'/> 
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Order"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewBuyerOrderPage;