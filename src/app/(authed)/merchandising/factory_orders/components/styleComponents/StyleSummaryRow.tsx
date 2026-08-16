import { useWatch } from "react-hook-form";
import { TableCell, TableRow } from "~/components";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import React from "react";

type Props = {
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
}

const StyleSummaryRow = ({methods}: Props) => {
    const totalQuantity = (
        useWatch({ control: methods.control, name: `factoryOrder.styles` }) ?? []
    ).reduce(
        (sum, style) => sum + (style.order_quantity ?? 0), 0
    );

    if(!methods) return null;

    return (
        totalQuantity > 0 && (
            <TableRow>
                <TableCell colSpan={5}>&nbsp;</TableCell>
                <TableCell className='text-left px-3 py-2 bg-secondary text-white'>{totalQuantity}</TableCell>
            </TableRow>
        )
    )
}

export default React.memo(StyleSummaryRow) as typeof StyleSummaryRow;