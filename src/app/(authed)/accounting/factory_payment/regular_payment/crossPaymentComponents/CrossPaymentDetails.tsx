/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { CrossPaymentFormValues } from "../crossPaymentConfig/formSchema";
import TableForm from "./CrossPaymentDetailsTableForm";
import type { useCrossPaymentForm } from "../crossPaymentConfig/useCrossPaymentForm";
import { crossPaymentTableFormColumns } from "../crossPaymentConfig/tableFormColumns";
import React from "react";

type props = {
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
    validationError: FieldErrors<CrossPaymentFormValues>;
    disabled?: boolean;
    documentSubmissionId: string;
}

const CrossPaymentDetails = (props: props) => {
    const { methods, validationError, disabled = false, documentSubmissionId } = props;

    const { fields: crossPaymentFields } = useFieldArray({
        control: methods.control,
        name: "details",
    });

    return (
        <TableForm 
            name={`details`}
            rows={crossPaymentFields}
            columns={crossPaymentTableFormColumns}
            register={methods.register}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            documentSubmissionId={documentSubmissionId}
        />
    )
}

export default React.memo(CrossPaymentDetails) as typeof CrossPaymentDetails;