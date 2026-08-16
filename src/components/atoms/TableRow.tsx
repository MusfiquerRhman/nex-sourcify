import clsx from "clsx";
import React from "react";

const TableRow = ({children, className}: {children: React.ReactNode, className?: string}) => {
    return (
        <tr className={clsx(className, 'even:bg-gray-light/30 p-2 text-center border-x-2 border-gray/20')}>
            {children}
        </tr>
    )
}

export default React.memo(TableRow) as typeof TableRow;