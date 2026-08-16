import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useBuyerOrderForm>['methods'];
}

const StyleSummaryRow = ({methods}: Props) => {
    const totalQuantity = (
        useWatch({ control: methods.control, name: `order.styles` }) ?? []
    ).reduce(
        (sum, style) => sum + (style.order_quantity ?? 0), 0
    );

    if(!methods) return null;

    return (
        totalQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={5}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 bg-secondary text-white' colSpan={1}>
                    {totalQuantity}
                </TableCell>
                <td colSpan={1}>&nbsp;</td>
            </TableRow>
        )
    )
}

export default React.memo(StyleSummaryRow) as typeof StyleSummaryRow;