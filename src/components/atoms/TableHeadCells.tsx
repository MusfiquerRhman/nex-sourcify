import clsx from "clsx";
import React from "react";

const TableHeadCells = ({ children, className, isAction }: { children: React.ReactNode; className?: string; isAction?: boolean }) => {
    return (
        <th className={clsx("nex-table-heading px-4 py-3 text-xs font-semibold", className, isAction ? "w-20" : undefined)}>
            {children}
        </th>
    );
};

export default React.memo(TableHeadCells) as typeof TableHeadCells;