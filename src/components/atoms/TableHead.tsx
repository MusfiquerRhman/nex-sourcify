import React from "react";

const TableHead = ({ children, variant = 'header' }: { children: React.ReactNode, variant?: 'header' | 'placeholder' }) => {
    const variants = {
        header: 'bg-primary-dark text-white rounded-lg',
        placeholder: 'bg-gray-light text-gray rounded-lg',
    }[variant];

    return (
        <thead className={variants}>
            {children}
        </thead>
    );
};

export default React.memo(TableHead) as typeof TableHead;