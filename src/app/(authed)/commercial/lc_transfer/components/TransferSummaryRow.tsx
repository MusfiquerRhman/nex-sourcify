/**
 * @description
 * This component represents the summary row in the LC Transfer details table. 
 * It calculates and displays the total quantity, total value, previous transfer quantity, 
 * previous transfer value, transfer quantity, and transfer value for all the LC Transfer details.
 * It uses the useWatch hook from react-hook-form to watch the details field of the form and updates 
 * the summary values whenever there is a change in the details.
 * The summary row is only displayed in the edit mode
 * 
 * @params
 * - methods: The methods object from useLCTransferForm, providing access to form control and state.
 */

import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import React from "react";
import type { useLCTransferForm } from "../config/useLcTransferForm";
import { safeNumber } from "~/utils/numbers";

type Props = {
    methods: ReturnType<typeof useLCTransferForm>['methods'];
}

const TransferSummaryRow = ({methods}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `details`,
    }) ?? [];

    const totalQuantity = shipments.reduce(
        (sum, s) => sum + safeNumber(s?.total_quantity ?? 0), 0
    );

    const totalValue = shipments.reduce(
        (sum, s) => sum + safeNumber(s?.total_value ?? 0), 0
    );

    const totalTransferQuantity = shipments.reduce(
        (sum, s) => sum + safeNumber(s?.transfer_quantity ?? 0), 0
    );

    const totalTransferValue = shipments.reduce(
        (sum, s) => sum + safeNumber(s?.transfer_value ?? 0), 0
    );

    const totalPreviousTransferQuantity = shipments.reduce(
        (sum, s) => sum + safeNumber(s?.previous_transfer_quantity ?? 0), 0
    );

    const totalPreviousTransferValue = shipments.reduce(
        (sum, s) => sum + safeNumber(s?.previous_transfer_value ?? 0), 0
    );

    return (
            totalQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={2}>&nbsp;</TableCell>
                <TableCell className='text-center px-3 py-2 bg-secondary text-white'>{totalQuantity}</TableCell>
                <TableCell className='text-center px-3 py-2 bg-secondary text-white'>{totalPreviousTransferQuantity}</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>{totalTransferQuantity}</TableCell>
                <TableCell className='text-center px-3 py-2 bg-secondary text-white'>{totalValue.toFixed(2)}</TableCell>
                <TableCell className='text-center px-3 py-2 bg-secondary text-white'>{totalPreviousTransferValue.toFixed(2)}</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>{totalTransferValue.toFixed(2)}</TableCell>
                <TableCell colSpan={2}>&nbsp;</TableCell>
            </TableRow>
        )
    )
}

export default React.memo(TransferSummaryRow) as typeof TransferSummaryRow;