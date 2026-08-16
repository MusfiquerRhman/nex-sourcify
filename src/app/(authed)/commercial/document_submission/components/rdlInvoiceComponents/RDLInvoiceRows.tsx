import { GenericFormTableRow, Portal } from "~/components";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import { formFields as rdlInvoiceTableFormFields } from "../../rdlInvoiceConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import FactoryInvoiceDetails from "../factoryInvoiceComponents/FactoryInvoiceDetails";
import { formatDate } from "~/utils/localDateString";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useDocumentSubmissionForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: {[key: string]: any};
}

const RdlInvoiceRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const buyerId = useWatch({ control: methods.control, name: `buyer_id`});

    const termId = useWatch({ control: methods.control, name: `term_id`});

    const documentSubmissionDBid = useWatch({ control: methods.control, name: `db_id`});

    const lc_sc_id = useWatch({ control: methods.control, name: `lc_sc_id`});

    const rdlInvoices = api.documentSubmission.getRdlInvoiceForDocumentSubmission.useQuery(
        (!!buyerId && !!termId && !!lc_sc_id) ? { 
            buyer_id: safeNumber(buyerId), 
            term_id: safeNumber(termId),
            lc_sc_id: lc_sc_id,
            document_submission_id: documentSubmissionDBid,
        } : skipToken
    ).data;

    // filter out already selected factory invoices
    const details = useWatch({
        control: methods.control,
        name: "rdlInvoices",
    });

    const selectedRDLInvoiceIds = details
        ?.filter((_, i) => i !== index)
        .map((detail) => detail.rdl_invoice_id);

    const filteredRDLInvoices = rdlInvoices?.filter(
        (invoice) => !selectedRDLInvoiceIds?.includes(invoice.id)
    );

    const selectedRDLInvoice = useWatch({
        control: methods.control,
        name: `rdlInvoices.${index}.rdl_invoice_id`,
    });

    const selectedRdlInvoiceNo = rdlInvoices?.find(invoice => invoice.id === selectedRDLInvoice)?.invoice_no;

    useEffect(() => {
        if (!selectedRDLInvoice || !rdlInvoices) return;

        const invoice = rdlInvoices.find(
            (fi) => fi.id === selectedRDLInvoice
        );

        if (!invoice) return;

        methods.setValue(
            `rdlInvoices.${index}.quantity`,
            invoice.total_quantity.toFixed(2),
            { shouldDirty: true }
        );

        methods.setValue(
            `rdlInvoices.${index}.rdl_value`,
            invoice.total_value.toFixed(2),
            { shouldDirty: true }
        );

        methods.setValue(
            `rdlInvoices.${index}.previously_received_rdl_value`,
            invoice.previous_value.toFixed(2),
            { shouldDirty: true }
        );

        methods.setValue(
            `rdlInvoices.${index}.invoice_date`,
            invoice.invoice_date ? formatDate(invoice.invoice_date): undefined,
            { shouldDirty: true }
        );
    }, [selectedRDLInvoice, rdlInvoices, index, methods]);

    const rdlInvoiceDbId = useWatch({
        control: methods.control,
        name: `rdlInvoices.${index}.db_id`,
    });
    
    const isEdit = !!rdlInvoiceDbId;

    const rdlValue = methods.watch(`rdlInvoices.${index}.rdl_value`);

    const previouslyReceivedRdlValue = methods.watch(`rdlInvoices.${index}.previously_received_rdl_value`);

    useEffect(() => {
        const path = `rdlInvoices.${index}.received_rdl_value` as const;

        const currentValue = methods.getValues(path);

        if (!currentValue || currentValue === undefined || currentValue === null || Number.isNaN(Number(currentValue))) {
            methods.setValue(path, (safeNumber(rdlValue) - safeNumber(previouslyReceivedRdlValue)));
        }
    }, [rdlValue, previouslyReceivedRdlValue, methods, index]);
    
    const { can_delete } = useModulePermissions();

    return (
        <>
            <GenericFormTableRow
                fields={rdlInvoiceTableFormFields({ rdlInvoice: filteredRDLInvoices, isEdit })}
                register={methods.register}
                removeRow={removeRow}
                disabled={disabled}
                canDelete={can_delete}
                validationError={validationError?.rdlInvoices}
                name={name}
                control={methods.control}
                index={index}
            />

            {!!selectedRdlInvoiceNo && (
                <Portal containerId="document_submissions_rdl_invoice_portal">
                    <FactoryInvoiceDetails invoiceIndex={index} 
                        methods={methods} 
                        validationError={validationError}
                        disabled={disabled}
                        selectedRdlInvoiceNo={selectedRdlInvoiceNo}
                    />
                </Portal>
            )}
        </>
    );
}

export default React.memo(RdlInvoiceRow) as typeof RdlInvoiceRow;