import clsx from "clsx";
import React from "react";

const TableRow = ({children, className}: {children: React.ReactNode, className?: string}) => {
    return (
        <tr className={clsx(className, 'nex-table-row text-center')}>
            {children}
        </tr>
    )
}

export default React.memo(TableRow) as typeof TableRow;