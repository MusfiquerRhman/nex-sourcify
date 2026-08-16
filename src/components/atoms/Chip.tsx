import clsx from "clsx";
import React from "react";

type ChipProps = {  
    label: string;
    type?: string;
};

const Chip = (props: ChipProps) => {
    const { label, type } = props;

    const variant = {
        default: 'bg-primary',
        success: 'bg-secondary',
        info: 'bg-blue-500',
        warning: 'bg-orange-400',
        error: 'bg-red',
    }[type ?? 'default'];

    return (
        <div className="w-full flex justify-center items-center">
            <div className={clsx("rounded-full text-white w-fit py-[3px] px-4 max-w-40 text-[0.75rem]", variant)}>
                {label}
            </div>
        </div>
    )
}

export default React.memo(Chip) as typeof Chip;