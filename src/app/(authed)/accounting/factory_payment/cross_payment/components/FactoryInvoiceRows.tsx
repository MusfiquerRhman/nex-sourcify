import { GenericFormTableRow } from "~/components";
import { type useCrossPaymentForm } from "../config/useCrossPaymentForm";
import { formFields as shipmentTableFormFields } from "../factoryInvoiceConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import type { CrossPaymentFormValues } from "../config/formSchema";
import { useModulePermissions } from "~/hooks";
import { skipToken } from "@tanstack/react-query";
import { formatDate } from "~/utils/localDateString";

type Props = {
    register: ReturnType<typeof useCrossPaymentForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
    validationError: FieldErrors<CrossPaymentFormValues>;
}

const FactoryInvoiceRows = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const buyerId = useWatch({ control: methods.control, name: `buyer_id` });
    const termId = useWatch({ control: methods.control, name: `term_id` });

    const { can_delete } = useModulePermissions();

    const cross_payment_id = useWatch({ control: methods.control, name: `db_id` });

    const factoryInvoice = api.crossPayments.getFactoryInvoicesByBuyer.useQuery(
        (!!buyerId && !!termId) ? { buyer_id: buyerId, term_id: termId, cross_payment_id: cross_payment_id } : skipToken
    )

    // filter out already selected factory invoices
    const details = useWatch({
        control: methods.control,
        name: "details",
    });

    const selectedFactoryInvoiceIds = details
        ?.filter((_, i) => i !== index)
        .map((detail) => detail.factory_invoice_id);

    const filteredFactoryShipments = factoryInvoice?.data?.filter(
        (invoice) => !selectedFactoryInvoiceIds?.includes(invoice.id)
    );

    const isEdit = !!useWatch({ control: methods.control, name: `details.${index}.db_id`});

    const factoryInvoiceId = useWatch({ control: methods.control, name: `details.${index}.factory_invoice_id` });
    
    const factoryInvoiceDetails = api.crossPayments.getFactoryInvoiceDetails.useQuery(
        !!factoryInvoiceId ? { factory_invoice_id: factoryInvoiceId } : skipToken
    );

    useEffect(() => {
        if (factoryInvoiceDetails.data) {
            const selectedFactoryInvoice = factoryInvoiceDetails.data[0];

            if (selectedFactoryInvoice) {
                methods.setValue(`details.${index}.factory_invoice_no`, selectedFactoryInvoice.factory_invoice_no);
                methods.setValue(`details.${index}.factory_invoice_date`, formatDate(selectedFactoryInvoice.factory_invoice_date));
                methods.setValue(`details.${index}.factory_name`, selectedFactoryInvoice.factory_name);
                methods.setValue(`details.${index}.invoice_quantity`, selectedFactoryInvoice.invoice_quantity.toString());
                methods.setValue(`details.${index}.invoice_value`, selectedFactoryInvoice.invoice_value.toString());
            }
        }
    }, [factoryInvoiceDetails.data, index, methods, factoryInvoiceId]);

    const isRegularized = useWatch({ control: methods.control, name: `details.${index}.regularized` });

    return (
        <GenericFormTableRow
            fields={shipmentTableFormFields({factoryInvoice: filteredFactoryShipments, isEdit: isEdit})}
            register={methods.register}
            removeRow={removeRow}
            disabled={disabled || !!(isRegularized === 'REGULARIZED')}
            validationError={validationError?.details ?? {}}
            name={name}
            control={methods.control}
            index={index}
            canDelete={can_delete}
        />
    );
}

export default React.memo(FactoryInvoiceRows) as typeof FactoryInvoiceRows;