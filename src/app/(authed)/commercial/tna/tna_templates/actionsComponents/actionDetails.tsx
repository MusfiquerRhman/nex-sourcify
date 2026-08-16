import { useFieldArray, type FieldErrors } from "react-hook-form";
import { tableFormColumns as tnaTableFormColumns } from "../actionsConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import type { FormValues } from "../config/formSchema";
import type { useTnaForm } from "../config/useTnaForm";
import TableForm from "./tnaTableForm";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useTnaForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
}

const TnaActionDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: actionFields, append: addAction, remove: removeAction
    } = useFieldArray<FormValues>({
        control: methods.control,
        name: "actions",
    });

    const utils = api.useUtils();

    const actionsAddRow = useCallback(() => {
        addAction({
            action_id: '',
            days: 0,
            alert_before: 0,
        });
    }, [addAction]);

    const deleteActionMutation = api.commercialTnaTemplates.deleteTnaTemplateAction.useMutation({
        onSuccess: async () => {
            toast.success("Action deleted successfully!");
            await Promise.all([
                utils.commercialTnaTemplates.getTnaTemplates.invalidate(),
                utils.commercialTnaTemplates.getTnaTemplateById.invalidate(),
            ]);
        },
    });

    const actionsRemoveRow = useCallback(async (index: number) => {
        try {
            // If the action has a db_id, it means it's already saved in the database and needs to be deleted
            if(!!actionFields[index]?.db_id) {
                await deleteActionMutation.mutateAsync({ id: actionFields[index].db_id });
            }
            removeAction(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Action: ${message}`);
        }
    }, [actionFields, deleteActionMutation, removeAction]);

    return (
        <TableForm
            name="actions"
            columns={tnaTableFormColumns}
            rows={actionFields}
            addRow={actionsAddRow}
            removeRow={actionsRemoveRow}
            methods={methods}
            register={methods.register}
            validationError={validationError}
            disabled={disabled}
        />
    );
}

export default React.memo(TnaActionDetails) as typeof TnaActionDetails;