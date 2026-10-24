/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { EarlySettlementFormValues } from "../config/formSchema";
import type { useEarlySettlementForm } from "../config/useEarlySettlementForm";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../shipmentConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import TableForm from "./shipmentTableForm";

type props = {
    methods: ReturnType<typeof useEarlySettlementForm>['methods'];
    validationError: FieldErrors<EarlySettlementFormValues>;
    disabled?: boolean;
}

const ShipmentDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, replace: replaceShipments
    } = useFieldArray<EarlySettlementFormValues>({
        control: methods.control,
        name: `pos`,
    });

    const earlySettlementId = useWatch({ control: methods.control, name: `db_id` });

    const { data: shipments } = api.earlySettlement.getPoDetails.useQuery(
        !!earlySettlementId ? { id: earlySettlementId } : skipToken
    )

    useEffect(() => {
        replaceShipments(
            (shipments?.shipments ?? []).map((item) => {
                return {
                    db_id: item.id,
                    style: item.style,
                    buyer_po: item.buyer_po,
                    destination: item.destination,
                    size: item.size,
                    order_quantity: item.order_quantity,
                    fob_rate: item.fob_rate,
                    rdl_value: item.rdl_value,
                    early_settlement_charge: item.early_settlement_charge,
                    effective_rdl_fob: item.effective_rdl_fob,
                    effective_rdl_value: item.effective_rdl_value,
                    factory_rate: item.factory_rate,
                    factory_value: item.factory_value,
                    commission_percentage: item.commission_percentage,
                    effective_commission_percentage: item.effective_commission_percentage,
                    commission_value: item.commission_value,
                    effective_commission: item.effective_commission,
                    dhaka_commission_percentage: item.dhaka_commission_percentage,
                    effective_dhaka_commission_percentage: item.effective_dhaka_commission_percentage,
                    dhaka_value: item.dhaka_value,
                    effective_dhaka_value: item.effective_dhaka_value,
                    overseas_commission_percentage: item.overseas_commission_percentage,
                    overseas_value: item.overseas_value,
                    effective_overseas_value: item.effective_overseas_value,
                    other_commission_percentage: item.other_commission_percentage,
                    other_value: item.other_value,
                    effective_other_value: item.effective_other_value
                }
            })
        )
    }, [shipments])

    return (
        <TableForm 
            name='pos'
            rows={shipmentFields}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            totals={shipments?.totals}
        />
    )
}

export default React.memo(ShipmentDetails) as typeof ShipmentDetails;