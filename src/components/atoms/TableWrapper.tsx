import clsx from "clsx";
import React from "react";

const TableWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={clsx("m-1 rounded-lg overflow-x-auto", className)}>
            <table className="w-full">
                {children}
            </table>
        </div>
    )
}

export default React.memo(TableWrapper) as typeof TableWrapper;