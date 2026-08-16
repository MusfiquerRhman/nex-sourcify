import React from "react";

const TableBody = ({ children }: { children: React.ReactNode }) => {
    return (
        <tbody className="rounded-lg border-b-2 border-gray/20">
            {children}
        </tbody>
    );
};

export default React.memo(TableBody) as typeof TableBody;