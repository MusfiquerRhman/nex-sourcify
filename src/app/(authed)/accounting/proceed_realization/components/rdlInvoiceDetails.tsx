/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { ProceedRealizationFormValues } from "../config/formSchema";
import type { useProceedRealizationForm } from "../config/useProceedRealizationForm";
import React, { useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../rdlInvoiceConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import TableForm from "./rdlInvoiceTableForm";
import { currencyFormatter } from "~/utils/localNumberStrings";
import { safeNumber } from "~/utils/numbers";

type props = {
    methods: ReturnType<typeof useProceedRealizationForm>['methods'];
    validationError: FieldErrors<ProceedRealizationFormValues>;
    disabled?: boolean;
}

const RdlInvoiceDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: rdlInvoiceFields, replace: replaceRdlInvoice
    } = useFieldArray<ProceedRealizationFormValues>({
        control: methods.control,
        name: `details`,
    });

    const selectedDocumentSubmissionId = useWatch({
        control: methods.control,
        name: `document_submission_id`
    });

    const { data: rdlInvoiceDetails } = api.proceedRealization.getRdlInvoiceDetailsForProceedRealization.useQuery(
        !!selectedDocumentSubmissionId ? { document_submission_id: selectedDocumentSubmissionId } : skipToken
    );

    const prevDocumentSubmissionId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!rdlInvoiceDetails) return;

        if (prevDocumentSubmissionId.current === selectedDocumentSubmissionId) return;
        
        prevDocumentSubmissionId.current = selectedDocumentSubmissionId;

        const existingRdlInvoice = methods.getValues(`details`) ?? [];

        replaceRdlInvoice(
            rdlInvoiceDetails.map((rdlInvoice) => {
                const existing = existingRdlInvoice.find(
                    (x) => x.rdl_invoice_id === rdlInvoice.rdl_invoice_id
                );

                return {
                    rdl_invoice_id: rdlInvoice.rdl_invoice_id ?? existing?.rdl_invoice_id,
                    rdl_invoice_no: rdlInvoice.rdl_invoice_no ?? existing?.rdl_invoice_no,
                    proceed_value: existing?.proceed_value,
                    db_id: existing?.db_id,
                    invoice_value: currencyFormatter(safeNumber(rdlInvoice.invoice_value ?? existing?.invoice_value), '$'),
                };
            })
        );
    }, [rdlInvoiceDetails, selectedDocumentSubmissionId]);

    return (
        <TableForm 
            name='details'
            rows={rdlInvoiceFields}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(RdlInvoiceDetails) as typeof RdlInvoiceDetails;