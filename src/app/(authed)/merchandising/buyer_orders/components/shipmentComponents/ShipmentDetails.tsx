/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { OrderFormValues } from "../../config/formSchema";
import TableForm from "./ShipmentDetailsTableForm";
import type { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import { tableFormColumns as shipmentTableFormColumns } from "../../shipmentConfig/tableFormColumns";
import React, { useCallback, useEffect } from "react";
import { Heading } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { skipToken } from "@tanstack/react-query";

type props = {
    styleIndex: number;
    methods: ReturnType<typeof useBuyerOrderForm>['methods'];
    validationError: FieldErrors<OrderFormValues>;
    disabled?: boolean;
}

const ShipmentDetails = (props: props) => {
    const { styleIndex, methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, append: addShipment, remove: removeShipment,
    } = useFieldArray<OrderFormValues>({
        control: methods.control,
        name: `order.styles.${styleIndex}.shipments`,
    });

    const addShipmentRow = useCallback(() => {
        addShipment({
            db_id: undefined,
            delivery_no: 0,
            buyer_po: '',
            etd_date: '',
            handover_date: '',
            destination_id: '',
            shipment_mode: '',
            size_id: '',
            lot_quantity: 0,
            fob_rate: 0,
            payment_term_id: '',
            rdl_fob_usd: undefined,
            rdl_value: undefined,
            rdl_value_usd: undefined,
            colors: [],
        });
    }, [addShipment]);

    const utils = api.useUtils();

    const deleteShipmentMutation = api.buyerOrders.deleteShipment.useMutation({
        onSuccess: async () => {
            await utils.buyerOrders.getBuyerOrders.invalidate();
            toast.success("Shipment deleted successfully!");
        },
    });

    const removeShipmentRow = useCallback(async (index: number) => {
        try {
            if(!!shipmentFields[index]?.db_id) {
                await deleteShipmentMutation.mutateAsync({ shipment_id: shipmentFields[index].db_id });
            }

            removeShipment(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Shipment: ${message}`);
        }
    }, [deleteShipmentMutation, removeShipment, shipmentFields]);

    const buyerId = useWatch({ control: methods.control, name: `order.buyer_id` });

    const handoverDateBuffer = api.handoverDates.getHandoverDateBufferByBuyerId.useQuery(
        !!buyerId ? { buyer_id: parseInt(buyerId) } : skipToken,
    ).data?.buffer ?? 7;

    
    const shipmentsData = useWatch({
        control: methods.control,
        name: `order.styles.${styleIndex}.shipments`,
    }) ?? [];

    const styleName = useWatch({ 
        control: methods.control, 
        name: `order.styles.${styleIndex}.style` 
    });

    const styleQuantity = useWatch({ 
        control: methods.control, 
        name: `order.styles.${styleIndex}.order_quantity` 
    });

    const shipments = useWatch({ 
        control: methods.control, 
        name: `order.styles.${styleIndex}.shipments` 
    });

    const currencyRate = useWatch({ 
        control: methods.control, 
        name: `order.currency_rate` 
    });

    const shipmentRdlFobs = shipmentsData.map(s => s?.fob_rate);
    const shipmentQuantities = shipmentsData.map(s => s?.lot_quantity);
    const etdDate = shipmentsData.map(s => s?.etd_date);
    const dbId = shipmentsData.map(s => s?.db_id);

    // Auto calculate handover date 
    useEffect(() => {
        if (!shipments?.length) return;

        shipments.forEach((shipment, index) => {
            if(!shipment.etd_date) return;

            const currentEtd = etdDate[index];
            // Only set handover date if it's not already set and it's a new shipment (no db_id)
            if (currentEtd && (dbId[index] === undefined || dbId[index] === null)) {
                const date = new Date(currentEtd);
                // Adding the buffer days
                date.setDate(date.getDate() - handoverDateBuffer);
                
                // Format back to YYYY-MM-DD for the input field
                const formattedHandoverDate = date.toISOString().split('T')[0];

                methods.setValue(
                    `order.styles.${styleIndex}.shipments.${index}.handover_date`,
                    formattedHandoverDate ?? '',
                    { shouldDirty: true }
                );
            }
        });
    }, [JSON.stringify(etdDate), handoverDateBuffer, methods.setValue]);


    // Auto calculate RDL values when FOB or Quantity change
    useEffect(() => {
        if (!shipments?.length) return;

        shipments.forEach((shipment, index) => {
            if (!shipment?.fob_rate && !shipment.lot_quantity) return;

            methods.setValue(
                `order.styles.${styleIndex}.shipments.${index}.rdl_fob_usd`, 
                (shipment.fob_rate / (currencyRate ?? 1))?.toFixed(2),
                { shouldDirty: true }
            );

            methods.setValue(
                `order.styles.${styleIndex}.shipments.${index}.rdl_value`, 
                (shipment.lot_quantity * shipment.fob_rate)?.toFixed(2),
                { shouldDirty: true }
            );

            methods.setValue(
                `order.styles.${styleIndex}.shipments.${index}.rdl_value_usd`, 
                (shipment.lot_quantity * shipment.fob_rate  / (currencyRate ?? 1))?.toFixed(2), 
                { shouldDirty: true }
            );
        });
    }, [
        JSON.stringify(shipmentRdlFobs), 
        JSON.stringify(shipmentQuantities), 
        JSON.stringify(currencyRate), 
        methods.setValue
    ]);


    const colorQuantity = (useWatch({
        control: methods.control,
        name: `order.styles.${styleIndex}.shipments`,
    }) ?? []).flatMap(shipment => shipment.colors?.map(color => color.quantity) ?? []);

    // Auto calculate lot quantity when color quantities change
    useEffect(() => {
        if (!shipments?.length) return;

        shipments.forEach((shipment, shipmentIndex) => {
            const totalColorQuantity = shipment.colors?.reduce(
                (sum, color) => sum + (color.quantity ?? 0), 0
            ) ?? 0;

            methods.setValue(
                `order.styles.${styleIndex}.shipments.${shipmentIndex}.lot_quantity`, 
                totalColorQuantity, 
                { shouldDirty: true }
            );
        })

    }, [JSON.stringify(colorQuantity), methods.setValue]);

    const ShipmentHeading = () => (
        <div className="flex flex-row items-center gap-4">
            <Heading as ='h3' className="mx-8">
                {styleIndex + 1}. PO Details
                {!!styleName && ( 
                    <> of
                        <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                            {styleName}
                        </span>
                        {!!styleQuantity && 
                            <span className="ml-2">
                                Quantity: <span className="rounded-lg emboss-inner px-3 py-1">
                                    {styleQuantity}
                                </span>
                            </span> 
                        }
                    </>
                ) }
            </Heading>
        </div>
    );

    return (
        <TableForm 
            title={<ShipmentHeading />}
            name={`order.styles.${styleIndex}.shipments`}
            rows={shipmentFields}
            columns={shipmentTableFormColumns}
            register={methods.register}
            addRow={addShipmentRow}
            removeRow={removeShipmentRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            styleIndex={styleIndex}
        />
    )
}

export default React.memo(ShipmentDetails) as typeof ShipmentDetails;