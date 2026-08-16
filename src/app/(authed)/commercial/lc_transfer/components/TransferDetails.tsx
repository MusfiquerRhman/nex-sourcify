/**
 * @description LC Transfer details table component that renders the list of LC Transfer details in a table format. 
 * It uses the TableForm component to render the form fields for each LC Transfer detail 
 * and allows adding, editing, and deleting LC Transfer details. The component is designed to be used within the LC Transfer form 
 * and is responsible for managing the dynamic list of LC Transfer details, 
 * including handling form state and validation errors for each detail row.
 * 
 * @params
 * - methods: The methods object from useLCTransferForm, providing access to form control and state.
 * - validationError: An object containing validation errors for the form fields, used to display error messages for each detail row.
 * - disabled: A boolean to disable the form fields when necessary, such as when the LC Transfer is in a non-editable state.
 */

import TableForm from "./TransferTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { LCTransferFormValues } from "../config/formSchema";
import { tableFormColumns as stylesTableFormColumns } from "../transferConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import React, { useCallback } from "react";
import type { useLCTransferForm } from "../config/useLcTransferForm";

type Props = {
    methods: ReturnType<typeof useLCTransferForm>['methods'];
    validationError: FieldErrors<LCTransferFormValues>;
    disabled?: boolean;
}

const TransferDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: transferFields, append: addTransfer, remove: removeTransfer,
    } = useFieldArray<LCTransferFormValues>({
        control: methods.control,
        name: "details",
    });
    

    const orderAddRow = useCallback(() => {
        addTransfer({
            db_id: undefined,
            factory_id: undefined as unknown as number,
            sales_contract_id: '',
            total_quantity: '',
            total_value: '',
            transfer_quantity: 0,
            transfer_value: 0,
            transfer_date: '',
        });
    }, [addTransfer]);

    const deleteTransferMutation = api.lcTransfer.deleteTransfer.useMutation({
        onSuccess: async () => {
            toast.success("LC Transfer detail deleted successfully!");
        },
    });

    const orderRemoveRow = useCallback(async (index: number) => {
        try {
            if(!!transferFields[index]?.db_id) {
                await deleteTransferMutation.mutateAsync({ lc_transfer_id: transferFields[index].db_id });
            }

            removeTransfer(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting LC Transfer detail: ${message}`);
        }
    }, [removeTransfer, transferFields]);

    return (
        <TableForm 
            name="details"
            rows={transferFields}
            columns={stylesTableFormColumns}
            register={methods.register}
            addRow={orderAddRow}
            removeRow={orderRemoveRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(TransferDetails) as typeof TransferDetails;