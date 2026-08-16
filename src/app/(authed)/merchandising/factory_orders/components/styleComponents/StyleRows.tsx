import { GenericFormTableRow, Portal } from "~/components";
import { formFields as stylesTableFormFields } from "../../styleConfig/tableFormFields";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import ShipmentDetails from "../shipmentComponents/ShipmentDetails";
import type { FieldErrors } from "react-hook-form";
import type { FactoryOrderFormValues } from "../../config/formSchema";
import React from "react";

type Props = {
    register: ReturnType<typeof useFactoryOrderForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues['factoryOrder']>;
}

const StyleRow = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError } =  props;

    return (
        <>
            <GenericFormTableRow
                fields={stylesTableFormFields()}
                register={methods.register}
                disabled={disabled}
                validationError={validationError?.styles ?? {}}
                name={name}
                control={methods.control}
                index={index}
            />

            <Portal containerId="shipment_details_portal">
                <ShipmentDetails styleIndex={index} 
                    methods={methods} 
                    validationError={validationError}
                    disabled={disabled}
                />
            </Portal>
        </>
    );
}

export default React.memo(StyleRow) as typeof StyleRow;