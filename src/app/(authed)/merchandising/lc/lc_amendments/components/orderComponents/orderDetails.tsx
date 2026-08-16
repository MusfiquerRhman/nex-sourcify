import TableForm from "./orderTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { FormValues } from "../../config/formSchema";
import type { useLCAmendmentForm } from "../../config/useLCAmendmentForm";
import { tableFormColumns as orderTableFormColumns } from "../../orderConfig/tableFormColumns";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useLCAmendmentForm>['methods'];
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

    const ordersAddRow = useCallback(() => {
        addOrder({
            db_id: undefined,
            order_id: '',
            pi_no: '',
            po_no: '',
            shipments: [],
        });
    }, [addOrder]);

    const removeOrderRow = useCallback(async (index: number) => {
        removeOrder(index);
    }, [removeOrder]);

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