import { TableCell, TableRow } from "~/components";
import React from "react";
import type { GetEarlySettlementPoTotalsTypes } from "~/types/merchandisingAPITypes";

type Props = {
    totals: GetEarlySettlementPoTotalsTypes | undefined;
}

const ShipmentSummaryRow = ({totals}: Props) => {
    return (
        <TableRow>
            <TableCell colSpan={4}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.order_quantity}
            </TableCell>
            <TableCell colSpan={1}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.rdl_value}
            </TableCell>
            <TableCell colSpan={2}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.effective_rdl_value}
            </TableCell>
            <TableCell colSpan={1}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.factory_value}
            </TableCell>
            <TableCell colSpan={2}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.commission_value}
            </TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.effective_commission}
            </TableCell>
            <TableCell colSpan={2}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.dhaka_value}
            </TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.effective_dhaka_value}
            </TableCell>
            <TableCell colSpan={1}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.overseas_value}
            </TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.effective_overseas_value}
            </TableCell>
            <TableCell colSpan={1}>&nbsp;</TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.other_value}
            </TableCell>
            <TableCell className='text-center px-3 py-2 bg-secondary text-white'>
                {totals?.effective_other_value}
            </TableCell>
        </TableRow>
    )
}

export default React.memo(ShipmentSummaryRow) as typeof ShipmentSummaryRow;
