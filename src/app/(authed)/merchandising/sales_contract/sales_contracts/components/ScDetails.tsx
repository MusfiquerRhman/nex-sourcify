import { useFieldArray, type FieldErrors } from "react-hook-form";
import { tableFormColumns } from "../detailsConfig/tableFormColumn";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import type { FormValues } from "../config/formSchema";
import type { useSalesContractForm } from "../config/useSalesContractForm";
import TableForm from "./scTableForm";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useSalesContractForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
    isEdit?: boolean;
    detailsCount?: number;
}

const ScDetails = ({ methods, validationError, disabled = false, isEdit = false, detailsCount }: Props) => {
    const { 
        fields: actionFields, append: addAction, remove: removeAction
    } = useFieldArray<FormValues>({
        control: methods.control,
        name: "details",
    });

    const utils = api.useUtils();

    const actionsAddRow = useCallback(() => {
        addAction({
            order_id: '',
        });
    }, [addAction]);

    const deleteActionMutation = api.salesContracts.deleteSalesContractDetail.useMutation({
        onSuccess: async () => {
            toast.success("Order reference deleted successfully!");
            await Promise.all([
                utils.salesContracts.getSalesContractById.invalidate(),
                utils.salesContracts.getSalesContracts.invalidate(),
            ])
        },
    });

    const removeSalesContractDetails = useCallback(async (index: number) => {
        try {
            // If the order reference has a db_id, it means it's already saved in the database and needs to be deleted
            if(!!actionFields[index]?.db_id) {
                await deleteActionMutation.mutateAsync({ id: actionFields[index].db_id });
            }
            removeAction(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Order Reference: ${message}`);
        }
    }, [actionFields, deleteActionMutation, removeAction]);

    return (
        <TableForm
            name="details"
            columns={tableFormColumns}
            rows={actionFields}
            addRow={actionsAddRow}
            removeRow={removeSalesContractDetails}
            methods={methods}
            register={methods.register}
            validationError={validationError}
            disabled={disabled}
            isEdit={isEdit}
            detailsCount={detailsCount}
        />
    );
}

export default React.memo(ScDetails) as typeof ScDetails;