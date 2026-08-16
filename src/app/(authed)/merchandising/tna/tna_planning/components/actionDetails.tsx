import TableForm from "./actionTableForm";
import type { FormValues } from "../config/formSchema";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { useTnaPlanningForm } from "../config/useTnaPlanningForm";
import { tableFormColumns } from "../actionConfig/tableFormColumns";
import { formFields } from "../actionConfig/tableFormFields";
import React from "react";

type Props = {
    methods: ReturnType<typeof useTnaPlanningForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
}

const ActionDetails = (props: Props) => {
    const { methods, validationError, disabled } = props;

    const { 
        fields: actionFields
    } = useFieldArray<FormValues>({
        control: methods.control,
        name: "actions",
    });

    return (
        <TableForm 
            name="actions"
            rows={actionFields}
            columns={tableFormColumns}
            register={methods.register}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(ActionDetails) as typeof ActionDetails;