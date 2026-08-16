import { GenericFormTableRow, Portal } from "~/components";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import { formFields as factoryInvoiceTableFormFields } from "../../factoryInvoiceConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import ShipmentDetails from "../shipmentComponents/ShipmentDetails";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useRDLInvoiceForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: {[key: string]: any};
}

const FactoryInvoiceRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const factoryId = useWatch({ control: methods.control, name: `details.${index}.factory_id`});

    const termId = useWatch({ control: methods.control, name: `term_id`});

    const rdlInvoiceDbId = useWatch({ control: methods.control, name: `db_id`});

    const lc_sc_id = useWatch({ control: methods.control, name: `lc_sc_id`});

    const factoryInvoices = api.rdlInvoice.getFactoryInvoiceForRDLInvoice.useQuery(
        (!!factoryId && !!termId && !!lc_sc_id) ? { 
            factory_id: safeNumber(factoryId), 
            term_id: safeNumber(termId),
            lc_sc_id: lc_sc_id,
            rdl_invoice_id: rdlInvoiceDbId,
        } : skipToken
    ).data;

    // filter out already selected factory invoices
    const details = useWatch({
        control: methods.control,
        name: "details",
    });

    const selectedFactoryInvoiceIds = details
        ?.filter((_, i) => i !== index)
        .map((detail) => detail.factory_invoice_id);

    const filteredFactoryInvoices = factoryInvoices?.filter(
        (invoice) => !selectedFactoryInvoiceIds?.includes(invoice.id)
    );

    const selectedFactoryInvoice = useWatch({
        control: methods.control,
        name: `details.${index}.factory_invoice_id`,
    });

    const selectedFactoryInvoiceNo = factoryInvoices?.find(invoice => invoice.id === selectedFactoryInvoice)?.invoice_no;

    useEffect(() => {
        if (!selectedFactoryInvoice || !factoryInvoices) return;

        const invoice = factoryInvoices.find(
            (fi) => fi.id === selectedFactoryInvoice
        );

        if (!invoice) return;

        methods.setValue(
            `details.${index}.quantity`,
            invoice.total_quantity,
            { shouldDirty: true }
        );

        methods.setValue(
            `details.${index}.factory_value`,
            invoice.factory_value,
            { shouldDirty: true }
        );
    }, [selectedFactoryInvoice, factoryInvoices, index, methods]);

    const { can_delete } = useModulePermissions();

    return (
        <>
            <GenericFormTableRow
                fields={factoryInvoiceTableFormFields({ factoryInvoices: filteredFactoryInvoices })}
                register={methods.register}
                removeRow={removeRow}
                disabled={disabled}
                canDelete={can_delete}
                validationError={validationError?.details}
                name={name}
                control={methods.control}
                index={index}
            />

            {!!selectedFactoryInvoiceNo && 
                <Portal containerId="rdl_invoice_shipment_details_portal">
                    <ShipmentDetails invoiceIndex={index} 
                        methods={methods} 
                        validationError={validationError}
                        disabled={disabled}
                        selectedFactoryInvoiceNo={selectedFactoryInvoiceNo}
                    />
                </Portal>
            }
        </>
    );
}

export default React.memo(FactoryInvoiceRow) as typeof FactoryInvoiceRow;