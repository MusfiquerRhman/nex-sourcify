'use client';

import { Button, Form, Wrapper, MessageBox } from "~/components";
import React, { useCallback, useState } from "react";
import { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import StylesDetails from "../../components/styleComponents/stylesDetails";
import type { shipment_modes } from "@prisma/client";
import { printingWhiteIcon } from "~/assets";
import PhotoContainer from "../../components/photoComponents/PhotoContainer";
import type { ParamsProp } from "~/types/params";

const EditBuyerOrderPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);
    
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: buyerOrderData, isLoading } = api.buyerOrders.getBuyerOrderById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useBuyerOrderForm(
        buyerOrderData ?? undefined
    );

    const isApprovedInFactoryOrder = buyerOrderData?.factory_orders?.approval_status === 2;

    // TRPC utils
    const utils = api.useUtils();

    const { can_update, can_view } = useModulePermissions();

    const updateBuyerOrder = api.buyerOrders.updateBuyerOrder.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer Order updated successfully!");
            await Promise.all([
                utils.buyerOrders.getBuyerOrderById.invalidate({ id }),
                utils.buyerOrders.getBuyerOrders.invalidate(),
            ]);
        },
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (buyerOrderData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                db_id: buyerOrderData.order?.db_id,
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
                styles: buyerOrderData.order?.styles?.map((style, styleIndex) => ({
                    ...style,
                    serial: styleIndex + 1,
                    db_id: style?.db_id,
                    product_type_id: Number(style.product_type_id),
                    product_id: Number(style.product_id),
                    fabric_id: Number(style.fabric_id),
                    supplier_id: Number(style.supplier_id),
                    order_quantity: style.order_quantity ?? undefined,
                    shipments: style?.shipments?.map((shipment, shipmentIndex) => ({
                          db_id: shipment?.db_id,
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
                              db_id: color?.db_id,
                              color_id: Number(color.color_id),
                              quantity: color.quantity,
                          }))
                    })),
                })),
                ref_no: buyerOrderData.order.ref_no,
            };

            await updateBuyerOrder.mutateAsync(payload);

        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Buyer Order: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [id, updateBuyerOrder]);

    return (
        <Wrapper heading='Update Buyer Order' 
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/buyer_order/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <Form 
                name='order'
                fields={formFields} 
                buttonLabel="Add New Buyer Order" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError.order ?? {}}
                error={error}
                control={control}
                disabled={!can_update || isApprovedInFactoryOrder}
            />
            <StylesDetails 
                methods={methods}
                validationError={validationError.order ?? {}}
                disabled={!can_update || isApprovedInFactoryOrder}
            />

            {/* Shipment Portal anchor */}
            <div id='shipment_details_portal'/>

            <MessageBox 
                message="Factory order has been approved for this order and cannot be updated." 
                active={isApprovedInFactoryOrder} 
                type="secondary" 
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Order"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || isApprovedInFactoryOrder}
                />
            </div>

            <PhotoContainer methods={methods} id={id} can_update={can_update}/>
        </Wrapper>
    )
};

export default EditBuyerOrderPage;
