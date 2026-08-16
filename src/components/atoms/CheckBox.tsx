import clsx from "clsx";
import React from "react";

type CheckBoxProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
> & {
    value?: boolean;
    onChange?: (value: boolean) => void;
    className?: string;
    disabled?: boolean;
};

const CheckBox = ({
    value,
    onChange,
    className,
    disabled,
    ...rest
}: CheckBoxProps) => {
    return (
        <label className="inline-flex items-center justify-center">
            <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange?.(e.target.checked)}
                disabled={disabled}
                className={clsx(
                    "h-5 w-5 cursor-pointer rounded-md border-gray-300",
                    "accent-secondary",
                    "transition-all duration-200",
                    "focus:ring-2 focus:ring-secondary focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...rest}
            />
        </label>
    );
};

export default React.memo(CheckBox);