import TableForm from "./OrderTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { ExFactoryFormValues } from "../../config/formSchema";
import type { useExfactoryForm } from "../../config/useExfactoryForm";
import { tableFormColumns as stylesTableFormColumns } from "../../orderConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    validationError: FieldErrors<ExFactoryFormValues>;
    disabled?: boolean;
}

const OrderDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: orderFields, append: addOrder, remove: removeOrder,
    } = useFieldArray<ExFactoryFormValues>({
        control: methods.control,
        name: "exfactory.orders",
    });
    
    const utils = api.useUtils();

    const orderAddRow = useCallback(() => {
        addOrder({
            db_id: undefined,
            order_id: '',
            shipments: [],
        });
    }, [addOrder]);

    const deleteOrderMutation = api.exFactory.deleteExFactoryOrder.useMutation({
        onSuccess: async () => {
            toast.success("Order deleted successfully!");
            await utils.buyerOrders.getBuyerOrders.invalidate();
        },
    });

    const orderRemoveRow = useCallback(async (index: number) => {
        try {
            if(!!orderFields[index]?.db_id) {
                await deleteOrderMutation.mutateAsync({ exfactory_order_id: orderFields[index].db_id });
            }

            removeOrder(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Order: ${message}`);
        }
    }, [deleteOrderMutation, removeOrder, orderFields]);

    const hasExFactoryId = Boolean(methods.watch("exfactory.db_id"));

    return (
        <TableForm 
            name="exfactory.orders"
            rows={orderFields}
            columns={stylesTableFormColumns}
            register={methods.register}
            addRow={orderAddRow}
            removeRow={orderRemoveRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            isEdit={Boolean(hasExFactoryId)}
        />
    )
}

export default React.memo(OrderDetails) as typeof OrderDetails;