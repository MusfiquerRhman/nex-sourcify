import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { DebitNoteFormValues } from "../config/formSchema";
import TableForm from "./DebitNoteDetailsTableForm";
import type { useDebitNoteForm } from "../config/useDebitNoteForm";
import React, { useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../shipmentConfig/tableFormColumns";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { toast } from "sonner";

type props = {
    methods: ReturnType<typeof useDebitNoteForm>['methods'];
    validationError: FieldErrors<DebitNoteFormValues>;
    disabled?: boolean;
}

const DebitNoteDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, append: addShipment, remove: removeShipment,
    } = useFieldArray<DebitNoteFormValues>({
        control: methods.control,
        name: `details`,
    });

    const addShipmentRow = useCallback(() => {
        addShipment({
            db_id: undefined,
            po_no: undefined,
            factory_invoice_no: undefined,
            exfactory_shipment_id: '',
            value: undefined,
        });
    }, [addShipment]);

    const utils = api.useUtils();

    const deleteShipmentMutation = api.debitNotes.deleteShipment.useMutation({
        onSuccess: async () => {
            await utils.debitNotes.getAllDebitNotes.invalidate();
            toast.success("Shipment deleted successfully!");
        },
    });

    const removeShipmentRow = useCallback(async (index: number) => {
        try {
            if(!!shipmentFields[index]?.db_id) {
                await deleteShipmentMutation.mutateAsync({ db_id: shipmentFields[index].db_id });
            }

            removeShipment(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Shipment: ${message}`);
        }
    }, [deleteShipmentMutation, removeShipment, shipmentFields]);

    return (
        <TableForm 
            name={`details`}
            rows={shipmentFields}
            addRow={addShipmentRow}
            removeRow={removeShipmentRow}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(DebitNoteDetails) as typeof DebitNoteDetails;