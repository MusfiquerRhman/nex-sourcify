import { GenericFormTableRow } from "~/components";
import type { useSalesContractForm } from "../config/useSalesContractForm";
import { formFields } from "../detailsConfig/tableFormFields";
import { api } from "~/trpc/react";
import React, { useEffect, memo } from "react";
import { skipToken } from "@tanstack/react-query";
import type { FieldErrors } from "react-hook-form";
import type { FormValues } from "../config/formSchema";
import { useModulePermissions } from "~/hooks/useModulePermissions";

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

const ScDetailsRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError, detailsCount } =  props;

    const buyer_id = methods.watch("buyer_id");
    const factory_id = methods.watch("factory_id");
    const salesContractId = methods.watch("db_id");

    const { data: orders } = api.salesContracts.getOrderIdForSalesContract.useQuery(
        Boolean(buyer_id && factory_id) ? {
            buyer_id: parseInt(buyer_id),
            factory_id: parseInt(factory_id),
            salesContractId: salesContractId ?? undefined,
        } : skipToken
    );

    const details = methods.watch("details");
    const order_id = methods.watch(`details.${index}.order_id`);
    
    const usedOrderIds = details?.filter((_, i) => i !== index).map((detail) => detail.order_id) ?? [];
    
    const filteredOrders = orders?.filter((order) => !usedOrderIds.includes(order.id.toString())) ?? [];

    useEffect(() => {
        if (!orders || !order_id) return;

        const selectedOrder = orders.find(
            (order) => order.id.toString() === order_id
        );

        if (!selectedOrder) return;

        methods.setValue(`details.${index}.season_name`, selectedOrder.season_name);
        methods.setValue(`details.${index}.buyer_name`, selectedOrder.buyer_name);

    }, [order_id, orders, index, methods]);

    const { can_delete } = useModulePermissions();

    
    return (
        <GenericFormTableRow
            fields={formFields({ 
                orders: filteredOrders, 
                disabledUpto: detailsCount,
                index: index
            })}
            register={methods.register}
            canDelete={can_delete}
            removeRow={removeRow}
            disabled={disabled}
            validationError={validationError?.details ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default memo(ScDetailsRow) as typeof ScDetailsRow;