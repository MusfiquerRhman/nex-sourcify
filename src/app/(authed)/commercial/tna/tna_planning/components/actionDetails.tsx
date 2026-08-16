import TableForm from "./actionTableForm";
import type { TNAPlanningFormValues } from "../config/formSchema";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { useTnaPlansForm } from "../config/useTnaPlansForm";
import { tableFormColumns } from "../actionConfig/tableFormColumns";
import React from "react";

type Props = {
    methods: ReturnType<typeof useTnaPlansForm>['methods'];
    validationError: FieldErrors<TNAPlanningFormValues>;
    disabled?: boolean;
}

const ActionDetails = (props: Props) => {
    const { methods, validationError, disabled } = props;

    const { 
        fields: actionFields
    } = useFieldArray<TNAPlanningFormValues>({
        control: methods.control,
        name: "details",
    });


    return (
        <TableForm 
            name="details"
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