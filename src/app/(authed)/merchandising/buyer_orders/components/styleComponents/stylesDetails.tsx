import TableForm from "./StyleTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { OrderFormValues } from "../../config/formSchema";
import type { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import { tableFormColumns as stylesTableFormColumns } from "../../styleConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useBuyerOrderForm>['methods'];
    validationError: FieldErrors<OrderFormValues>;
    disabled?: boolean;
}

const StylesDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: styleFields, append: addStyle, remove: removeStyle,
    } = useFieldArray<OrderFormValues>({
        control: methods.control,
        name: "order.styles",
    });

    const utils = api.useUtils();

    const stylesAddRow = useCallback(() => {
        addStyle({
            db_id: undefined,
            product_type_id: '',
            product_id: '',
            style: '',
            fabric_id: '',
            supplier_id: '',
            order_quantity: 0,
            shipments: [],
        });
    }, [addStyle]);

    const deleteStylesMutation = api.buyerOrders.deleteStyle.useMutation({
        onSuccess: async () => {
            toast.success("Style deleted successfully!");
            await utils.buyerOrders.getBuyerOrders.invalidate();
        },
    });

    const stylesRemoveRow = useCallback(async (index: number) => {
        try {
            if(!!styleFields[index]?.db_id) {
                await deleteStylesMutation.mutateAsync({ style_id: styleFields[index].db_id });
            }

            removeStyle(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Style: ${message}`);
        }
    }, [deleteStylesMutation, removeStyle, styleFields]);

    return (
        <TableForm 
            name="order.styles"
            rows={styleFields}
            columns={stylesTableFormColumns}
            register={methods.register}
            addRow={stylesAddRow}
            removeRow={stylesRemoveRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(StylesDetails) as typeof StylesDetails;