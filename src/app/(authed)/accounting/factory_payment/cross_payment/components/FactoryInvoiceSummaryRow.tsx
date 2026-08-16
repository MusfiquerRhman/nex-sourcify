import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useCrossPaymentForm } from "../config/useCrossPaymentForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
}

const FactoryInvoiceSummaryRow = ({methods}: Props) => {
    const shipments = useWatch({
        control: methods.control,
        name: `details`,
    }) ?? [];

    const totalFactoryValueUsd = shipments.reduce(
        (sum, s) => sum + (Number(s?.value) ?? 0), 0
    );

    return (
        totalFactoryValueUsd > 0 && (
            <TableRow>
                <TableCell colSpan={5}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white' colSpan={1}>
                    {totalFactoryValueUsd.toFixed(2)}
                </TableCell>
            </TableRow>
        )
    )
}

export default React.memo(FactoryInvoiceSummaryRow) as typeof FactoryInvoiceSummaryRow;