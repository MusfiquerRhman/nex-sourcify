import { Button, Portal } from "~/components";
import TagShipmentDetails from "./TagDetails";
import { tagIcon } from "~/assets";
import { formatDateForInput } from "~/utils/localDateString";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { FactoryInvoiceDetailsFormValues } from "../../config/formSchema";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import { safeNumber } from "~/utils/numbers";

interface Props {
    methods: ReturnType<typeof useFactoryInvoiceForm>['methods'];
    isLoading?: boolean;
    disabled?: boolean;
}

const Tags = ({ methods, isLoading, disabled }: Props) => {
    const [showShipments, setShowShipments] = useState(false);
    
    // Fetch shipments for tagging based on selected LC/SC and Term
    const lc_sc_id = methods.getValues("lc_sc_id");
    const term_id = methods.getValues("term_id");

    const { data: shipments, isLoading: isTagLoading } = api.factoryInvoice.getShipmentDetailsForTagShipments.useQuery(
        !!lc_sc_id && !!term_id ? { lc_sc_id, term_id: safeNumber(term_id) } : skipToken
    );

    type FactoryInvoiceDetailsFormValuesType = {
        shipments: FactoryInvoiceDetailsFormValues[];
    };

    const shipmentMethods = useForm<FactoryInvoiceDetailsFormValuesType>();

    const { control: shipmentControl, register: shipmentRegister, watch } = shipmentMethods;

    // Setup field array for shipments in the tag details form
    const { 
        fields: shipmentFields, replace: replaceShipment
    } = useFieldArray<FactoryInvoiceDetailsFormValuesType>({
        control: shipmentControl,
        name: "shipments",
    });

    // set the form values when shipments data is fetched
    useEffect(() => {
        if (shipments) {
            const mapped = shipments.map((shipment) => ({
                db_id: undefined,
                exfactory_shipment_id: shipment.id,
                order_no: shipment.order_no,
                style: shipment.style,
                po: shipment.po,
                exfactory_date: formatDateForInput(shipment.exfactory_date),
                destination: shipment.destination,
                order_quantity: shipment.order_quantity,
                delivery_quantity: shipment.delivery_quantity,
                factory_fob: shipment.factory_fob,
                factory_value: shipment.factory_value,
                checked: false,
            }));
            replaceShipment(mapped);
        }
    }, [shipments, replaceShipment]);

    const watchedShipments = watch("shipments");

    const syncUncheckedShipments = () => {
        // IDs of unchecked rows
        const uncheckedShipmentIds = watchedShipments
            .filter(shipment => !shipment.checked)
            .map(shipment => shipment.exfactory_shipment_id);

        // Current parent details
        const currentDetails = methods.getValues("details") || [];

        // Remove unchecked shipments from parent form
        const updatedDetails = currentDetails.filter(
            detail =>
                !uncheckedShipmentIds.includes(
                    detail.exfactory_shipment_id
                )
        );

        methods.setValue("details", updatedDetails);
    };

    // Handle adding selected shipments to the factory invoice details form
    const addShipmentToTag = () => {
        const selectedShipments = watchedShipments.filter(s => s.checked);

        const selectedShipmentIds = selectedShipments.map(s => s.exfactory_shipment_id);

        // Existing parent details
        const existingDetails = methods.getValues("details") || [];

        // Existing shipment IDs already in parent form
        const existingIds = existingDetails.map(
            detail => detail.exfactory_shipment_id
        );

        // Only add IDs that do not already exist
        const newDetails = selectedShipmentIds
            .filter(id => !existingIds.includes(id))
            .map(id => ({
                exfactory_shipment_id: id,
            }));

        methods.setValue("details", [
            ...existingDetails,
            ...newDetails,
        ]);

        syncUncheckedShipments();
        setShowShipments(false);
    };

    return (
        <>
            <Button
                variant="secondary"
                label="Tag Shipments"
                className="max-w-80 mx-8 mb-3"
                disabled={isLoading || disabled}
                leftIcon={tagIcon}
                onClick={() => setShowShipments(true)}
            />

            {showShipments && (
                <Portal>
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={() => setShowShipments(false)}
                    >
                        <div className="bg-background rounded-lg py-1 w-[calc(100%-2rem)] h-auto max-h-[90vh] space-y-4 overflow-x-hidden overflow-y-scroll pr-2 custom-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TagShipmentDetails 
                                disabled={isLoading || disabled}
                                onCloseShipmentDetails={() => setShowShipments(false)}
                                addShipmentToTag={addShipmentToTag}
                                shipmentFields={shipmentFields}
                                shipmentRegister={shipmentRegister}
                                isLoading={isTagLoading}
                                control={shipmentControl}
                            />
                        </div>
                    </div>
                </Portal>
            )}
        </>
    )
}


export default React.memo(Tags);