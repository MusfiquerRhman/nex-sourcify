import { GenericFormTableRow, Portal } from "~/components";
import type { useExfactoryForm } from "../../config/useExfactoryForm";
import { formFields as orderTableFormFields } from "../../orderConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useExfactoryOrderStore } from "~/store/useExfactoryOrderStore";
import ShipmentDetails from "../shipmentComponents/ShipmentDetails";
import { useModulePermissions } from "~/hooks";

interface Props {
    register: ReturnType<typeof useExfactoryForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    validationError: {[key: string]: any};
}

const OrderRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const exfactory_id = useWatch({ control: methods.control, name: `exfactory.db_id` });
    const buyer_id = useWatch({ control: methods.control, name: `exfactory.buyer_id` });
    const factory_id = useWatch({ control: methods.control, name: `exfactory.factory_id` });
    const payment_term_id = useWatch({ control: methods.control, name: `exfactory.payment_type` });

    const { data: orders } = api.exFactory.getOrdersForExFactory.useQuery(
        (!!buyer_id && !!factory_id && !!payment_term_id) 
            ? { 
                    buyer_id: Number(buyer_id),
                    exfactory_id, 
                    factory_id: Number(factory_id), 
                    payment_term_id: Number(payment_term_id) 
            } 
            : skipToken
    );

    const setOrders = useExfactoryOrderStore((state) => state.setOrders);

    useEffect(() => {
        if (orders) {
            setOrders(orders);
        }
    }, [orders, setOrders]);

    const existingOrders = methods.watch("exfactory.orders");
    
    const usedOrderIds = existingOrders?.filter((_, i) => i !== index).map((detail) => detail.order_id) ?? [];
    
    // Filter out already selected orders from the options
    const filteredOrders = orders?.filter((order) => !usedOrderIds.includes(order.order_id)) ?? [];

    const { can_delete } = useModulePermissions();

    return (
        <>
            <GenericFormTableRow
                fields={orderTableFormFields({ 
                    orders: filteredOrders, 
                    isEdit: !!exfactory_id
                })}
                canDelete={can_delete}
                register={methods.register}
                removeRow={removeRow}
                disabled={disabled}
                validationError={validationError?.orders}
                name={name}
                control={methods.control}
                index={index}
            />

            <Portal containerId="shipment_details_portal">
                <ShipmentDetails orderIndex={index} 
                    methods={methods} 
                    validationError={validationError}
                    disabled={disabled}
                />
            </Portal>
        </>
    );
}

export default React.memo(OrderRow) as typeof OrderRow;