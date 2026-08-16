import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useDebitNoteForm } from "../config/useDebitNoteForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useDebitNoteForm>['methods'];
}

const ShipmentSummaryRow = ({methods}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `details`,
    }) ?? [];

    const totalShipmentQuantity = shipments.reduce(
        (sum, s) => sum + Number(s?.value ?? 0), 0
    );

    return (
            totalShipmentQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={2}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalShipmentQuantity.toFixed(2)}
                </TableCell>
            </TableRow>
        )
    )
}

export default React.memo(ShipmentSummaryRow) as typeof ShipmentSummaryRow;