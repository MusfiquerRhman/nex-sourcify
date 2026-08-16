import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    styleIndex: number;
    canViewTransferRate: boolean;
}

const ShipmentSummaryRow = ({methods, styleIndex, canViewTransferRate}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `factoryOrder.styles.${styleIndex}.shipments`,
    }) ?? [];

    const totalShipmentQuantity = shipments.reduce(
        (sum, s) => sum + (s?.lot_quantity ?? 0), 0
    );

    const totalFactoryValue = shipments.reduce(
        (sum, s) => sum + (Number(s?.factory_value) ?? 0), 0
    );

    const totalTransferValue = shipments.reduce(
        (sum, s) => sum + (Number(s?.transfer_value) ?? 0), 0
    );

    return (
            totalShipmentQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={9}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>{totalShipmentQuantity}</TableCell>
                <TableCell colSpan={1}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>{totalFactoryValue.toFixed(2)}</TableCell>
                {canViewTransferRate && <TableCell colSpan={1}>&nbsp;</TableCell>}
                {canViewTransferRate && <TableCell className='text-left px-3 py-2 bg-secondary text-white'>{totalTransferValue.toFixed(2)}</TableCell>}
            </TableRow>
        )
    )
}

export default React.memo(ShipmentSummaryRow) as typeof ShipmentSummaryRow;