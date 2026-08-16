import { useFieldArray, type FieldErrors } from "react-hook-form";
import { tableFormColumns as tnaTableFormColumns } from "../actionsConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import type { FormValues } from "../config/formSchema";
import type { useTnaForm } from "../config/useTnaForm";
import TableForm from "./tnaTableForm";
import React, { useCallback, useEffect } from "react";
import { skipToken } from "@tanstack/react-query";

type Props = {
    methods: ReturnType<typeof useTnaForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
}

const TnaActionDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: actionFields, append: addAction, remove: removeAction, replace
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

    const buyerId = methods.watch("buyer_id");

    const { data: baseAction} = api.tnaTemplates.getBaseTnaActionByBuyers.useQuery(
        !!buyerId ? { buyer_id: Number(buyerId) } : skipToken,
    );

    useEffect(() => {
        if (!baseAction || !buyerId) return;

        const currentActions = methods.getValues("actions") ?? [];
        const baseActionStr = baseAction.toString();

        if (currentActions.length > 0) {
            // If the first row already has the correct ID, don't update (prevents loops)
            if (currentActions[0]?.action_id === baseActionStr) return;

            // Update only the first row's action_id
            methods.setValue("actions.0.action_id", baseActionStr, {
                shouldValidate: true,
                shouldDirty: true
            });
        } else {
            // If the array is empty, initialize it with the base action
            replace([
                {
                    action_id: baseActionStr,
                    days: 0,
                    alert_before: 0,
                }
            ]);
        }
    }, [baseAction, buyerId, methods, replace]);

    const deleteActionMutation = api.tnaTemplates.deleteTnaTemplateAction.useMutation({
        onSuccess: async () => {
            toast.success("Action deleted successfully!");
            await Promise.all([
                utils.tnaTemplates.getTnaTemplates.invalidate(),
                utils.tnaTemplates.getTnaTemplateById.invalidate(),
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