import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useBuyerOrderForm>['methods'];
    styleIndex: number;
}

const ShipmentSummaryRow = ({methods, styleIndex}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `order.styles.${styleIndex}.shipments`,
    }) ?? [];

    const totalShipmentQuantity = shipments.reduce(
        (sum, s) => sum + (s?.lot_quantity ?? 0), 0
    );

    const totalRdlValue = shipments.reduce(
        (sum, s) => sum + (Number(s?.rdl_value) ?? 0), 0
    );

    const totalRdlValueUsd = shipments.reduce(
        (sum, s) => sum + (Number(s?.rdl_value_usd) ?? 0), 0
    );

    return (
            totalShipmentQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={8}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalShipmentQuantity}
                </TableCell>
                <TableCell colSpan={2}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalRdlValue.toFixed(2)}
                </TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalRdlValueUsd.toFixed(2)}
                </TableCell>
            </TableRow>
        )
    )
}

export default React.memo(ShipmentSummaryRow) as typeof ShipmentSummaryRow;