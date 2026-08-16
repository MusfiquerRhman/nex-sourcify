import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { ExFactoryFormValues } from "../../config/formSchema";
import TableForm from "./ShipmentDetailsTableForm";
import type { useExfactoryForm } from "../../config/useExfactoryForm";
import { tableFormColumns as shipmentTableFormColumns } from "../../shipmentConfig/tableFormColumns";
import React, { useCallback, useEffect } from "react";
import { Heading } from "~/components";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useExfactoryOrderStore } from "~/store/useExfactoryOrderStore";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { toast } from "sonner";

type props = {
    orderIndex: number;
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    validationError: FieldErrors<ExFactoryFormValues>;
    disabled?: boolean;
}

const ShipmentDetails = (props: props) => {
    const { orderIndex, methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, append: addShipment, remove: removeShipment
    } = useFieldArray<ExFactoryFormValues>({
        control: methods.control,
        name: `exfactory.orders.${orderIndex}.shipments`,
    });

    const order_id = useWatch({ control: methods.control, name: `exfactory.orders.${orderIndex}.order_id` });
    const exfactory_id = useWatch({ control: methods.control, name: `exfactory.db_id` });
    const payment_type = useWatch({ control: methods.control, name: `exfactory.payment_type` });

    const { data: shipments } = api.exFactory.getShipmentsForExFactoryOrder.useQuery(
        (!!order_id && !!payment_type) ? {  order_id, exfactory_id, payment_type } : skipToken
    );

    useEffect(() => {
        if (shipments) {
            // Clear existing shipments before appending new ones
            removeShipment();
            shipments.forEach((shipment) => {
                addShipment({
                    db_id: shipment.db_id ?? undefined,
                    shipment_details_id: shipment.shipment_detail_id,
                    po_no: shipment.po,
                    style_no: shipment.style,
                    destination: shipment.destination,
                    colors: shipment.colors,
                    lot_quantity: shipment.lot_quantity.toString(),
                    previous_shipment_quantity: shipment.previous_shipment_quantity?.toString(),
                    shipment_mode: shipment.shipment_mode ?? '',
                    shipment_quantity: Number(shipment.shipment_quantity ?? 0),
                    po_close: shipment.po_close ?? false,
                });
            });
        }
    }, [shipments, addShipment, removeShipment]);

    const orderID = useWatch({
        control: methods.control,
        name: `exfactory.orders.${orderIndex}.order_id`,
    }) ?? [];

    const orders = useExfactoryOrderStore((state) => state.orders);

    const ShipmentHeading = () => (
        <div className="flex flex-row items-center gap-4">
            <Heading as ='h3' className="mx-8">
                {orderIndex + 1}. Shipment Details
                {!!orderID && ( 
                    <> of
                        <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                            {orders.find((order) => order.order_id === orderID)?.ref_no ?? "Selected Order"}
                        </span>
                    </>
                ) }
            </Heading>
        </div>
    );

    const utils = api.useUtils();

    const deleteShipmentMutation = api.exFactory.deleteExFactoryShipment.useMutation({
        onSuccess: async () => {
            toast.success("Shipment deleted successfully!");
            await utils.buyerOrders.getBuyerOrders.invalidate();
        },
    });

    const removeShipmentRow = useCallback(async (index: number) => {
        try {
            if(!!shipmentFields[index]?.db_id) {
                await deleteShipmentMutation.mutateAsync({ exfactory_shipment_id: shipmentFields[index].db_id });
            }

            removeShipment(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Shipment: ${message}`);
        }
    }, [deleteShipmentMutation, removeShipment, shipmentFields]);


    return (
        <TableForm 
            title={<ShipmentHeading />}
            name={`exfactory.orders.${orderIndex}.shipments`}
            rows={shipmentFields}
            columns={shipmentTableFormColumns}
            register={methods.register}
            removeRow={removeShipmentRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            orderIndex={orderIndex}
        />
    )
}

export default React.memo(ShipmentDetails) as typeof ShipmentDetails;