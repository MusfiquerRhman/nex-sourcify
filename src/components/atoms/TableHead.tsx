import React from "react";

const TableHead = ({ children, variant = 'header' }: { children: React.ReactNode, variant?: 'header' | 'placeholder' }) => {
    const variants = {
        header: 'nex-table-head sticky top-0 z-10',
        placeholder: 'nex-table-placeholder',
    }[variant];

    return (
        <thead className={variants}>
            {children}
        </thead>
    );
};

export default React.memo(TableHead) as typeof TableHead;