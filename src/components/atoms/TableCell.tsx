import clsx from "clsx";
import React from "react";

type TableCellProps = {
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
    fixedLength?: boolean;
}

const TableCell = ({children, className, colSpan, fixedLength = true}: TableCellProps) => {
    const variant = {
        fixed: "min-w-[160px]",
        auto: "min-w-none",
    }[fixedLength ? 'fixed' : 'auto'];

    return (
        <td  colSpan={colSpan} 
            className={clsx("nex-table-cell px-4 py-3 text-[0.8rem] text-wrap w-fit max-w-[250px]", variant, className)}
        >
            {children}
        </td>
    )
}

export default React.memo(TableCell) as typeof TableCell;