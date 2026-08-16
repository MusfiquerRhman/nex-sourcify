import clsx from "clsx";
import React from "react";

type HeadingProps = {
    className?: string;
    as?: "h1" | "h2" | "h3" | "h4" | "h5";
    children: React.ReactNode;
}

export const Heading = ({ className, as = 'h1', children, ...props }: HeadingProps) => {
    const variantClasses = {
        h1: "text-[3rem] py-1 font-semibold text-primary-dark font-lato",
        h2: "text-2xl pb-4 pt-2 font-semibold",
        h3: "text-xl py-2 font-medium",
        h4: "text-lg py-2 font-medium",
        h5: "text-base py-1 font-medium"
    }[as];

    const Tag = as; // Dynamic tag based on 'as' prop

    return (
        <Tag className={clsx(variantClasses, className)} {...props}> {children} </Tag>
    );
};

export default React.memo(Heading) as typeof Heading;