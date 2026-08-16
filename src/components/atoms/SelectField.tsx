import Select, { components, type SingleValue } from "react-select";
import clsx from "clsx";
import React from "react";

type Option = {
    label: string;
    value: string | number | boolean;
};

type FormSelectProps = {
    options?: Option[];
    value: string | number | boolean | null;
    onChange: (value: string | number | boolean | null) => void;
    error?: boolean;
    disabled?: boolean;
};

const SelectField = ({ options, value, onChange, error, disabled}: FormSelectProps) => {
    return (
        <Select
            unstyled
            isMulti={false}
            options={options}
            value={options?.find((c) => String(c.value) === String(value)) ?? null}
            onChange={(val: SingleValue<Option>) => onChange(val ? val.value : null)}
            isDisabled={disabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isSearchable
            styles={{
                menuPortal: (base) => ({...base, zIndex: 9999}),
            }}
            components={{
                DropdownIndicator: disabled ? () => null : components.DropdownIndicator,
                IndicatorSeparator: () => null,
            }}
            classNames={{
                control: ({ isDisabled }) => clsx(
                    "mb-1 appearance-none py-2 px-3 rounded-lg outline-none emboss-inner w-full",
                    error && "border border-red-500",
                    isDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                ),
                valueContainer: () => "px-0 flex flex-wrap overflow-visible",
                singleValue: () => "text-gray-900 whitespace-normal break-words leading-snug",
                input: () => "m-0 p-0 w-full min-w-0",
                placeholder: () => "text-gray-400 whitespace-normal",
                menu: () => "rounded-lg bg-white shadow-lg border border-gray-200 min-w-[120px]",
                option: ({ isFocused, isSelected }) => clsx(
                    "px-3 py-2 cursor-pointer text-wrap min-w-[120px] break-all",
                    isSelected && "bg-primary text-white",
                    isFocused && !isSelected && "bg-secondary-accent text-white"
                ),
            }}
        />
    )
}

export default React.memo(SelectField) as typeof SelectField;