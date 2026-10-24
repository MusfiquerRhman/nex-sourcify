import clsx from "clsx";
import React from "react";

const TableWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={clsx("nex-table-shell m-1 min-w-0 overflow-x-auto", className)}>
            <table className="nex-table w-full">
                {children}
            </table>
        </div>
    )
}

export default React.memo(TableWrapper) as typeof TableWrapper;