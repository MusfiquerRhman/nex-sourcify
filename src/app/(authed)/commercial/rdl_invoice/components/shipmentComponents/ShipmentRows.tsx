import { GenericFormTableRow } from "~/components";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import { useWatch, type FieldErrors } from "react-hook-form";
import React, { useEffect } from "react";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import type { RDLInvoiceFormValues } from "../../config/formSchema";
import { safeNumber } from "~/utils/numbers";

type Props = {
    register: ReturnType<typeof useRDLInvoiceForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: FieldErrors<RDLInvoiceFormValues>;
    invoiceIndex: number ;
}

const ShipmentRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, invoiceIndex } =  props;

    const invoiceQuantity = useWatch({
        control: methods.control,
        name: `details.${invoiceIndex}.factoryInvoiceDetails.${index}.invoice_quantity`,
    });

    const orderQuantity = useWatch({
        control: methods.control,
        name: `details.${invoiceIndex}.factoryInvoiceDetails.${index}.order_quantity`,
    });

    const previousQuantity = useWatch({
        control: methods.control,
        name: `details.${invoiceIndex}.factoryInvoiceDetails.${index}.previous_quantity`,
    });

    const invoice_fob = useWatch({
        control: methods.control,
        name: `details.${invoiceIndex}.factoryInvoiceDetails.${index}.invoice_fob`,
    });

    useEffect(() => {
        methods.setValue(
            `details.${invoiceIndex}.factoryInvoiceDetails.${index}.invoice_value`, 
            (safeNumber(invoiceQuantity) * safeNumber(invoice_fob)).toFixed(2)
        );
    }, [invoiceQuantity, invoice_fob, methods, invoiceIndex, index]);

    useEffect(() => {
        const path = `details.${invoiceIndex}.factoryInvoiceDetails.${index}.invoice_quantity` as const;

        const currentValue = methods.getValues(path);

        if (currentValue === undefined || currentValue === null || Number.isNaN(Number(currentValue))) {
            methods.setValue(path, safeNumber(orderQuantity) - safeNumber(previousQuantity));
        }
    }, [orderQuantity, previousQuantity, methods, invoiceIndex, index]);

    return (
        <GenericFormTableRow
            fields={shipmentTableFormFields()}
            register={methods.register}
            disabled={disabled}
            validationError={validationError?.details?.[invoiceIndex]?.factoryInvoiceDetails ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;