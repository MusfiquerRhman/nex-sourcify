import { GenericFormTableRow } from "~/components";
import type { useSalesContractForm } from "../config/useSalesContractForm";
import { formFields } from "../detailsConfig/tableFormFields";
import { api } from "~/trpc/react";
import React, { useEffect } from "react";
import { skipToken } from "@tanstack/react-query";
import type { FieldErrors } from "react-hook-form";
import type { FormValues } from "../config/formSchema";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useSalesContractForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useSalesContractForm>['methods'];
    validationError: FieldErrors<FormValues>;
    isEdit?: boolean;
    detailsCount?: number;
}

const ScAmendmentDetailsRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError, detailsCount } =  props;

    const salesContractId = methods.watch("sales_contract_id");

    const { data: newOrders } = api.salesContractAmendments.getNewOrderIdForSalesContract.useQuery(
        salesContractId ? { salesContractId: salesContractId } : skipToken,
    );

    const details = methods.watch("details");
    const order_id = methods.watch(`details.${index}.order_id`);
    
    const usedOrderIds = details?.filter((_, i) => i !== index).map((detail) => detail.order_id) ?? [];
    
    const filteredOrders = newOrders?.filter((order) => !usedOrderIds.includes(order.id.toString())) ?? [];

    useEffect(() => {
        if (!newOrders || !order_id) return;

        const selectedOrder = newOrders.find(
            (order) => order.id.toString() === order_id
        );

        if (!selectedOrder) return;

        methods.setValue(`details.${index}.season_name`, selectedOrder.season_name);
        methods.setValue(`details.${index}.buyer_name`, selectedOrder.buyer_name);

    }, [order_id, newOrders, index, methods]);

    const { can_delete } = useModulePermissions();
    
    return (
        <GenericFormTableRow
            fields={formFields({ 
                orders: filteredOrders, 
                disabledUpto: detailsCount,
                index: index
            })}
            canDelete={can_delete}
            register={methods.register}
            removeRow={removeRow}
            disabled={disabled}
            validationError={validationError?.details ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(ScAmendmentDetailsRow) as typeof ScAmendmentDetailsRow;