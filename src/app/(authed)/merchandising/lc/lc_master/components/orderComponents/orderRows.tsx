import { GenericFormTableRow } from "~/components";
import type { useLCForm } from "../../config/useLCForm";
import { formFields as orderTableFormFields } from "../../orderConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useMemo } from "react";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useLCForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useLCForm>['methods'];
    validationError: {[key: string]: any};
    handleAction?: (index: number) => void;
}

const OrderRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError, handleAction } =  props;

    const buyer_id = useWatch({ control: methods.control, name: "buyer_id" });

    const lc_id = methods.watch("db_id");

    // Fetch orders based on selected buyer_id
    const orders = api.lcMaster.getOrdersForLc.useQuery(!!buyer_id ? { 
        buyer_id: buyer_id,
        lc_id: lc_id
    } : skipToken).data ?? [];
    
    // Filter out the selected order_id from the dropdown options to prevent duplicate selection
    const order_id = methods.watch(`details.${index}.order_id`);
    const allSelectedOrders = methods.watch("details");

    const filteredOrders = useMemo(() => {
        if (!orders) return [];

        const selectedIds = new Set(
            allSelectedOrders
                ?.map((d, i) => i !== index ? d?.order_id : null)
                .filter(Boolean)
        );

        return orders.filter((order) => {
            // allow current selected value (important for edit case)
            if (order.order_id === order_id) return true;

            // block others already selected
            return !selectedIds.has(order.order_id);
        });

    }, [orders, allSelectedOrders, index, order_id]);

    const lcOrderDbId = useWatch({ control: methods.control, name: "details" })?.[index]?.db_id;  

    const { can_delete } = useModulePermissions();
    
    return (
        <>
            <GenericFormTableRow
                fields={orderTableFormFields({filteredOrders: filteredOrders ?? [], id: lcOrderDbId})}
                register={methods.register}
                canDelete={can_delete}
                removeRow={removeRow}
                disabled={disabled}
                validationError={validationError?.styles}
                name={name}
                control={methods.control}
                index={index}
                handleAction={lcOrderDbId ? handleAction : undefined}
            />
        </>
    );
}

export default React.memo(OrderRow) as typeof OrderRow;