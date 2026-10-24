import React from "react";

const TableBody = ({ children }: { children: React.ReactNode }) => {
    return (
        <tbody className="nex-table-body">
            {children}
        </tbody>
    );
};

export default React.memo(TableBody) as typeof TableBody;