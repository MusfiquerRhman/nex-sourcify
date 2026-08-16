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
        fixed: "min-w-[175px]",
        auto: "min-w-none"
    }[fixedLength ? 'fixed' : 'auto'];

    return (
        <td  colSpan={colSpan} 
            className={clsx("border-r-2 text-[0.8rem] border-gray/20 p-1 text-wrap w-fit max-w-[300px]", variant, className)}
        >
            {children}
        </td>
    )
}

export default React.memo(TableCell) as typeof TableCell;