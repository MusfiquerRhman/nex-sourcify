import { GenericFormTableRow } from "~/components";
import { type useLCForm } from "../../config/useLCForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { type FieldErrors } from "react-hook-form";
import React from "react";
import type { FormValues } from "../../config/formSchema";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

interface Props {
    register: ReturnType<typeof useLCForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useLCForm>['methods'];
    validationError: FieldErrors<FormValues>;
    orderIndex: number ;
}

const ShipmentRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, orderIndex } =  props;

    const shipmentDetailsId = methods.getValues(`details.${orderIndex}.shipments.${index}.shipment_details_id`);

    const { data: hasExfactory, isLoading } = api.lcMaster.checkExfactoryOfShipment.useQuery(
        !!shipmentDetailsId ? { shipment_details_id: shipmentDetailsId } : skipToken,
        { enabled: !!shipmentDetailsId }
    );
    
    return (
        <>
            <GenericFormTableRow
                fields={shipmentTableFormFields()}
                register={methods.register}
                disabled={disabled || hasExfactory || isLoading}
                validationError={validationError?.details?.[orderIndex]?.shipments ?? {}}
                name={name}
                control={methods.control}
                index={index}
            />
        </>
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;