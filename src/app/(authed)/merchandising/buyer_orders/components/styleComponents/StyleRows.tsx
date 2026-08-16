import { GenericFormTableRow, Portal } from "~/components";
import type { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import { formFields as stylesTableFormFields } from "../../styleConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import ShipmentDetails from "../shipmentComponents/ShipmentDetails";
import React from "react";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useBuyerOrderForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useBuyerOrderForm>['methods'];
    validationError: {[key: string]: any};
}

const StyleRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const productTypeId = useWatch({ control: methods.control, name: `order.styles.${index}.product_type_id` }) ?? '';

    const { can_delete } = useModulePermissions();

    return (
        <>
            <GenericFormTableRow
                fields={stylesTableFormFields({productTypeId: parseInt(productTypeId)})}
                register={methods.register}
                removeRow={removeRow}
                disabled={disabled}
                validationError={validationError?.styles}
                name={name}
                canDelete={can_delete}
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