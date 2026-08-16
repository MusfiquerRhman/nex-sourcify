/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { CrossPaymentFormValues } from "../config/formSchema";
import TableForm from "./FactoryInvoiceDetailsTableForm";
import type { useCrossPaymentForm } from "../config/useCrossPaymentForm";
import { tableFormColumns as shipmentTableFormColumns } from "../factoryInvoiceConfig/tableFormColumns";
import React, { useCallback } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { formatDateForInput } from "~/utils/localDateString";

type props = {
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
    validationError: FieldErrors<CrossPaymentFormValues>;
    disabled?: boolean;
}

const FactoryInvoiceDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: factoryInvoice, append: addShipment, remove: removeShipment,
    } = useFieldArray<CrossPaymentFormValues>({
        control: methods.control,
        name: `details`,
    });

    const addShipmentRow = useCallback(() => {
        addShipment({
            db_id: undefined,
            factory_invoice_no: undefined,
            factory_invoice_id: '',
            factory_payment_no: '',
            factory_invoice_date: '',
            factory_name: '',
            invoice_quantity: '',
            invoice_value: '',
            value: 0,
            factory_payment_date: formatDateForInput(new Date()),
        });
    }, [addShipment]);

    const utils = api.useUtils();

    const deleteShipmentMutation = api.crossPayments.deleteFactoryInvoiceFromCrossPayment.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.crossPayments.getCrossPaymentById.invalidate(),
                utils.crossPayments.getCrossPaymentList.invalidate(),
                utils.crossPayments.searchCrossPayments.invalidate()
            ]);
            toast.success("Factory Invoice deleted successfully!");
        },
    });

    const removeShipmentRow = useCallback(async (index: number) => {
        try {
            if(!!factoryInvoice[index]?.db_id) {
                await deleteShipmentMutation.mutateAsync({ db_id: factoryInvoice[index].db_id });
            }

            removeShipment(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Factory Invoice: ${message}`);
        }
    }, [deleteShipmentMutation, removeShipment, factoryInvoice]);

    return (
        <TableForm 
            name={`details`}
            rows={factoryInvoice}
            columns={shipmentTableFormColumns}
            register={methods.register}
            addRow={addShipmentRow}
            removeRow={removeShipmentRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(FactoryInvoiceDetails) as typeof FactoryInvoiceDetails;