import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { OrderChecklistFormValues } from "../config/formSchema";
import type { useOrderChecklistForm } from "../config/useOrderChecklistForm";
import React from "react";
import { tableFormColumns } from "../listConfig/tableFormColumns";
import TableForm from "./shipmentTableForm";

type Props = {
    methods: ReturnType<typeof useOrderChecklistForm>['methods'];
    validationError: FieldErrors<OrderChecklistFormValues>;
    disabled?: boolean;
}

const ListDetails = (props: Props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields
    } = useFieldArray<OrderChecklistFormValues>({
        control: methods.control,
        name: `details`,
    });

    return (
        <TableForm 
            name='details'
            rows={shipmentFields}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(ListDetails) as typeof ListDetails;
