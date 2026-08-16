import clsx from "clsx";
import React from "react";

type InfoProps = {
    info?: string;
    variant?: "error" | "info";
    className?: string;
};

const Info = ({ info, variant, className }: InfoProps) => {
    if (!info) return null;

    const variantClasses = {
        error: "text-red-accent",
        info: "text-gray-accent p-1",
    }[variant ?? "info"];

    return (
        <p className={clsx(variantClasses, className)}>{info}</p>
    )
}

export default React.memo(Info) as typeof Info;