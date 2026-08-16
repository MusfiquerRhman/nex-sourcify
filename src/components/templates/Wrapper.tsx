import clsx from "clsx";
import Heading from "../atoms/Heading";
import React from "react";

type WrapperProps = {
    children: React.ReactNode;
    heading: string;
    subSectionLeft?: React.ReactNode;
    subSectionRight?: React.ReactNode;
    className?: string;
}

// Wrapper component to provide a consistent layout with heading and optional subsections
const Wrapper = ({ children, heading, subSectionLeft, subSectionRight, className }: WrapperProps) => {
    return (
        <section className={clsx('w-full flex flex-col justify-center pb-16 pt-4')}>
            <Heading>{heading}</Heading>
            <div className='w-full flex flex-col justify-center items-center mt-2'>
                <div className={clsx('w-full', className)}>
                    <div className={clsx(
                        "flex flex-row justify-between w-full", 
                        !!subSectionLeft || !!subSectionRight ? 'mb-2' : 'mb-0'
                    )}>
                        <div className="w-full flex justify-start">{subSectionLeft}</div>
                        <div className="w-full flex justify-end">{subSectionRight}</div>
                    </div>
                    <div className="flex flex-col rounded-lg emboss justify-center">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default React.memo(Wrapper) as typeof Wrapper;