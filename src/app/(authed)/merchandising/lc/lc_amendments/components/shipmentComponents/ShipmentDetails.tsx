import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { FormValues } from "../../config/formSchema";
import TableForm from "./ShipmentDetailsTableForm";
import type { useLCAmendmentForm } from "../../config/useLCAmendmentForm";
import { tableFormColumns as shipmentTableFormColumns } from "../../shipmentConfig/tableFormColumns";
import React, { useEffect, useMemo } from "react";
import { Button, Info, Loader } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { skipToken } from "@tanstack/react-query";

interface Props {
    orderIndex: number;
    methods: ReturnType<typeof useLCAmendmentForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
    onCloseShipmentDetails: () => void;
}

const ShipmentDetails = (props: Props) => {
    const { orderIndex, methods, validationError, disabled = false, onCloseShipmentDetails } = props;

    const data = methods.getValues(`details.${orderIndex}`);

    const { data: shipments, isLoading } = api.lcMaster.getShipmentDetailsForOrder.useQuery(
        !!data?.order_id && !!data?.db_id ? { order_id: data.order_id, lc_order_id: data.db_id } : skipToken
    );

    const { 
        fields: shipmentFields, replace: replaceShipment
    } = useFieldArray<FormValues>({
        control: methods.control,
        name: `details.${orderIndex}.shipments`,
    });

    const fromShipments = useWatch({
        control: methods.control,
        name: `details.${orderIndex}.shipments`,
    });

    // Memoize selectedShipments to stabilize the reference
    const selectedShipments = useMemo(
        () => fromShipments?.filter(s => s?.checked) ?? [],
        [fromShipments]
    );

    // Now this only re-runs when selectedShipments actually changes
    useEffect(() => {
        if (!fromShipments || fromShipments.length === 0) return;

        const po = fromShipments.filter(s => s?.checked).map(s => s.po).join(", ");

        methods.setValue(`details.${orderIndex}.po_no`, po);
    }, [fromShipments, shipmentFields]);
        
    useEffect(() => {
        if (shipments) {
            const mapped = shipments.map((shipment) => ({
                shipment_details_id: shipment.shipment_details_id,
                style: shipment.style,
                po: shipment.po,
                factory_name: shipment.factory_name,
                exfactory_date: shipment.exfactory_date
                    ? new Date(shipment.exfactory_date).toISOString().split('T')[0]
                    : '',
                destination: shipment.destination,
                quantity: shipment.quantity.toString(),
                rdl_fob: shipment.rdl_fob.toString(),
                rdl_value: shipment.rdl_value?.toFixed(2),
                factory_transfer_value: shipment.factory_transfer_value.toFixed(2),
                checked: shipment.status,
            }));

            replaceShipment(mapped);
        }
    }, [shipments]);

    const utils = api.useUtils();

    const lcOrderDbId = methods.watch(`details.${orderIndex}.db_id`);

    const addShipmentMutation = api.lcMaster.addShipmentsToLc.useMutation({
        onSuccess: async () => {
            // await Promise.all([
            // ]);
            await utils.lcMaster.getShipmentDetailsForOrder.invalidate(
                { order_id: data?.order_id ?? "", lc_order_id: data?.db_id ?? "" }
            );
            await utils.lcMaster.getLc.invalidate();
            await utils.lcMaster.getLCbyId.invalidate();
            await utils.lcAmendment.getLcAmendmentById.invalidate();
            await utils.lcAmendment.getLcDetailsForAmendment.invalidate();
            toast.success("Shipment added to LC successfully!");
        }
    });

    const onSubmitAll = () => {
        if (!selectedShipments) return;

        try {
            const shipmentDetailIds = selectedShipments
                .map((s) => s.shipment_details_id)
                .filter((id): id is string => typeof id === "string");

            addShipmentMutation.mutate({
                lc_order_id: lcOrderDbId ?? "",
                shipment_details_ids: shipmentDetailIds,
            });
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error adding shipments to LC: ${parsedError}`);
        }
        finally {
            onCloseShipmentDetails();
        }
    }

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <TableForm 
                        title={'Select Shipments'}
                        name={`details.${orderIndex}.shipments`}
                        rows={shipmentFields}
                        columns={shipmentTableFormColumns}
                        register={methods.register}
                        disabled={disabled}
                        methods={methods}
                        validationError={validationError}
                        orderIndex={orderIndex}
                    />
                
                    <div className="w-full flex flex-row justify-between">
                        <div>
                            <Button type="button"
                                onClick={onCloseShipmentDetails}
                                label={"Close"}
                                variant="delete"
                                className="text-lg tracking-wide mt-6 max-w-40 mx-8"
                            />
                            <Info info="You can also click outside the popup box to close the shipment details view." 
                                variant="info"
                                className="px-8 mb-4"
                            />
                        </div>

                        <Button type="button" 
                            onClick={() => onSubmitAll()}
                            label={"Add shipments in LC"} 
                            className="text-lg tracking-wide mt-6 max-w-80 m-8"
                            disabled={ isLoading || disabled}
                        />
                    </div>
                </>
            )}
        </>
    )
}

export default React.memo(ShipmentDetails) as typeof ShipmentDetails;