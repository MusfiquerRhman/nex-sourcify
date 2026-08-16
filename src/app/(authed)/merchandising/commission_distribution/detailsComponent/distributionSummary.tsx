import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useCommissionDistributionForm } from "../config/useCommissionDistributionForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useCommissionDistributionForm>['methods'];
}

const DistributionSummaryRow = ({methods}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `details`,
    }) ?? [];

    const totalDhakaAmount = shipments.reduce(
        (sum, s) => sum + (Number(s?.dhaka_commission_amount) ?? 0), 0
    );

    const totalOverseasAmount = shipments.reduce(
        (sum, s) => sum + (Number(s?.overseas_commission_amount) ?? 0), 0
    );

    const totalOtherAmount = shipments.reduce(
        (sum, s) => sum + (Number(s?.others_commission_amount) ?? 0), 0
    );

    const totalRdlValue = shipments.reduce(
        (sum, s) => sum + (Number(s?.rdl_value) ?? 0), 0
    );

    const totalFactoryValue = shipments.reduce(
        (sum, s) => sum + (Number(s?.factory_value) ?? 0), 0
    );

    const totalOrderQuantity = shipments.reduce(
        (sum, s) => sum + (Number(s?.order_quantity) ?? 0), 0
    );

    const totalCommissionValue = shipments.reduce(
        (sum, s) => sum + (Number(s?.commission_value) ?? 0), 0
    );

    return (
        totalOrderQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={4}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalOrderQuantity}
                </TableCell>
                <TableCell colSpan={2}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalRdlValue.toFixed(2)}
                </TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalFactoryValue.toFixed(2)}
                </TableCell>
                <TableCell colSpan={1}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalCommissionValue.toFixed(2)}
                </TableCell>
                <TableCell colSpan={2}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalDhakaAmount.toFixed(2)}
                </TableCell>
                <TableCell colSpan={1}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalOverseasAmount.toFixed(2)}
                </TableCell>
                <TableCell colSpan={1}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>
                    {totalOtherAmount.toFixed(2)}
                </TableCell>
            </TableRow>
        )
    )
}

export default React.memo(DistributionSummaryRow) as typeof DistributionSummaryRow;