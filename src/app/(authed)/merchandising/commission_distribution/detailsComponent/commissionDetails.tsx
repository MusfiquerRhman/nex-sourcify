import TableForm from "./CommissionDistributionTableForm"
import type { CommissionDistributionFormValues } from "../config/formSchema";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { useCommissionDistributionForm } from "../config/useCommissionDistributionForm";
import { formFields } from "../detailsConfig/tableFormFields";
import { tableFormColumns } from "../detailsConfig/tableFormColumns";
import React from "react";
    
type Props = {
    methods: ReturnType<typeof useCommissionDistributionForm>['methods'];
    validationError: FieldErrors<CommissionDistributionFormValues>;
    disabled?: boolean;
}

const CommissionDetails = (props: Props) => {
    const { methods, validationError, disabled } = props;

    const { 
        fields: actionFields
    } = useFieldArray<CommissionDistributionFormValues>({
        control: methods.control,
        name: "details",
    });

    return (
        <TableForm 
            fields={formFields()}
            validationError={validationError}
            disabled={disabled}
            methods={methods}
            columns={tableFormColumns}
            name='details'
            rows={actionFields}
            title={"Commission Details"}
        />
    )
}

export default React.memo(CommissionDetails) as typeof CommissionDetails;