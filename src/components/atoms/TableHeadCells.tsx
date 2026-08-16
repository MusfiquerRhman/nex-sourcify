import clsx from "clsx";
import React from "react";

const TableHeadCells = ({ children, className, isAction }: { children: React.ReactNode; className?: string; isAction?: boolean }) => {
    return (
        <th className={clsx("p-2 border-r-2 border-white/20 font-lato", className, isAction ? "w-20" : undefined)}>
            {children}
        </th>
    );
};

export default React.memo(TableHeadCells) as typeof TableHeadCells;