import { GenericFormTableRow } from "~/components";
import { type useLCAmendmentForm } from "../../config/useLCAmendmentForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { type FieldErrors } from "react-hook-form";
import React from "react";
import type { FormValues } from "../../config/formSchema";

interface Props {
    register: ReturnType<typeof useLCAmendmentForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useLCAmendmentForm>['methods'];
    validationError: FieldErrors<FormValues>;
    orderIndex: number ;
}

const ShipmentRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, orderIndex } =  props;
    
    return (
        <>
            <GenericFormTableRow
                fields={shipmentTableFormFields()}
                register={methods.register}
                disabled={disabled}
                validationError={validationError?.details?.[orderIndex]?.shipments ?? {}}
                name={name}
                control={methods.control}
                index={index}
            />
        </>
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;