import { useFieldArray, type FieldErrors } from "react-hook-form";
import { tableFormColumns } from "../detailsConfig/tableFormColumn";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import type { FormValues } from "../config/formSchema";
import type { useSalesContractForm } from "../config/useSalesContractForm";
import TableForm from "./scAmendmentTableForm";
import { skipToken } from "@tanstack/react-query";
import React, { useCallback, useEffect } from "react";

interface Props {
    methods: ReturnType<typeof useSalesContractForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
    isEdit?: boolean;
    detailsCount?: number;
}

const ScAmendmentDetails = ({ methods, validationError, disabled = false, isEdit = false, detailsCount }: Props) => {
    const { 
        fields: actionFields, append: addAction, remove: removeAction, replace: replaceActions
    } = useFieldArray<FormValues>({
        control: methods.control,
        name: "details",
    });

    const salesContractId = methods.watch("sales_contract_id");

    const { data: existingOrders } = api.salesContractAmendments.getExistingOrderIdForSalesContract.useQuery(
        salesContractId ? { salesContractId: salesContractId } : skipToken,
    );

    useEffect(() => {
        if (!existingOrders || isEdit) return;

        replaceActions(
            (existingOrders ?? []).map((order) => ({
                order_id: order.id.toString(),
            }))
        );
    }, [existingOrders, replaceActions, isEdit]);

    const utils = api.useUtils();

    const actionsAddRow = useCallback(() => {
        addAction({
            order_id: '',
        });
    }, [addAction]);

    const deleteActionMutation = api.salesContractAmendments.deleteSalesContractAmendmentDetail.useMutation({
        onSuccess: async () => {
            toast.success("Order reference deleted successfully!");
            await Promise.all([
                utils.salesContractAmendments.getSalesContractAmendmentById.invalidate(),
                utils.salesContractAmendments.getExistingOrderIdForSalesContract.invalidate(),
                utils.salesContractAmendments.getNewOrderIdForSalesContract.invalidate(),
                utils.salesContractAmendments.getSalesContractAmendments.invalidate(),
                utils.salesContractAmendments.searchSalesContractAmendments.invalidate(),
                utils.salesContracts.getSalesContractById.invalidate({ id: salesContractId })
            ]);
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

export default React.memo(ScAmendmentDetails) as typeof ScAmendmentDetails;