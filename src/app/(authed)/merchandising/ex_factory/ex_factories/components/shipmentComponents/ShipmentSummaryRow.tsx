import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useExfactoryForm } from "../../config/useExfactoryForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    orderIndex: number;
}

const ShipmentSummaryRow = ({methods, orderIndex}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `exfactory.orders.${orderIndex}.shipments`,
    }) ?? [];

    const totalShipmentQuantity = shipments.reduce(
        (sum, s) => sum + (s?.shipment_quantity ?? 0), 0
    );

    const totalLotQuantity = shipments.reduce(
        (sum, s) => sum + (Number(s?.lot_quantity)?? 0), 0
    );


    return (
            totalShipmentQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={4}>&nbsp;</TableCell>
                <TableCell className='text-center px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalLotQuantity}
                </TableCell>
                <TableCell>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalShipmentQuantity}
                </TableCell>
                <TableCell colSpan={4}>&nbsp;</TableCell>
            </TableRow>
        )
    )
}

export default React.memo(ShipmentSummaryRow) as typeof ShipmentSummaryRow;