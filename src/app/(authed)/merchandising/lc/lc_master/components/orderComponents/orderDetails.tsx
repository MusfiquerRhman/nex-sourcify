import TableForm from "./orderTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { FormValues } from "../../config/formSchema";
import type { useLCForm } from "../../config/useLCForm";
import { tableFormColumns as orderTableFormColumns } from "../../orderConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useLCForm>['methods'];
    validationError: FieldErrors<FormValues>;
    disabled?: boolean;
    handleAction?: (index: number) => void;
}

const OrderDetails = ({ methods, validationError, disabled = false, handleAction }: Props) => {
    const { 
        fields: orderFields, append: addOrder, remove: removeOrder,
    } = useFieldArray<FormValues>({
        control: methods.control,
        name: "details",
    });

    const utils = api.useUtils();

    const ordersAddRow = useCallback(() => {
        addOrder({
            db_id: undefined,
            order_id: '',
            pi_no: '',
            po_no: '',
            shipments: [],
        });
    }, [addOrder]);

    const deleteOrderMutation = api.lcMaster.deleteOrderFromLc.useMutation({
        onSuccess: async () => {
            toast.success("Order deleted successfully!");
            await utils.buyerOrders.getBuyerOrders.invalidate();
        },
    });

    const removeOrderRow = useCallback(async (index: number) => {
        try {
            if(!!orderFields[index]?.db_id) {
                await deleteOrderMutation.mutateAsync({ lc_order_id: orderFields[index].db_id });
            }

            removeOrder(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Order: ${message}`);
        }
    }, [deleteOrderMutation, removeOrder, orderFields]);

    return (
        <TableForm 
            name="details"
            rows={orderFields}
            columns={orderTableFormColumns}
            register={methods.register}
            addRow={ordersAddRow}
            removeRow={removeOrderRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            handleAction={handleAction}
        />
    )
}

export default React.memo(OrderDetails) as typeof OrderDetails;