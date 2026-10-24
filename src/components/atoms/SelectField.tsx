"use client";

import Select, { components, type SingleValue } from "react-select";
import clsx from "clsx";
import React from "react";

export type Option = {
    label: string;
    value: string | number | boolean;
};

type FormSelectProps = {
    options?: Option[];
    value: string | number | boolean | null;
    onChange: (value: string | number | boolean | null) => void;
    error?: boolean;
    disabled?: boolean;
    className?: string;
    prioritizeExactMatch?: boolean;
};

const SelectField = (props: FormSelectProps) => {
    const { options, value, onChange, error, disabled, className = '', prioritizeExactMatch = false } = props;

    const [searchInput, setSearchInput] = React.useState("");

    const rankedOptions = React.useMemo(() => {
        const normalizedSearch = searchInput.trim().toLowerCase();
        if (!prioritizeExactMatch || !normalizedSearch) return options;

        return options?.slice().sort((left, right) => {
            const leftIsExactMatch = left.label.trim().toLowerCase() === normalizedSearch;
            const rightIsExactMatch = right.label.trim().toLowerCase() === normalizedSearch;
            return Number(rightIsExactMatch) - Number(leftIsExactMatch) || left.label.length - right.label.length;
        });
    }, [options, prioritizeExactMatch, searchInput]);

    return (
        <Select
            unstyled
            isMulti={false}
            options={rankedOptions}
            value={options?.find((c) => String(c.value) === String(value)) ?? null}
            onChange={(val: SingleValue<Option>) => onChange(val ? val.value : null)}
            onInputChange={prioritizeExactMatch ? setSearchInput : undefined}
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
                control: ({ isDisabled, isFocused }) => clsx(
                    "nex-select mb-1 w-full min-w-[130px] appearance-none px-4 py-2.5 outline-none",
                    error && "is-errored",
                    isFocused && "is-focused",
                    isDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                    className
                ),
                valueContainer: () => "px-0 flex flex-wrap overflow-visible",
                singleValue: () => "text-gray-900 whitespace-normal break-words leading-snug",
                input: () => "m-0 p-0 w-full min-w-0",
                placeholder: () => "text-gray-400 whitespace-normal",
                menu: () => "nex-select-menu min-w-[210px] rounded-md border border-primary-light bg-white p-1.5 shadow-lg",
                option: ({ isFocused, isSelected }) => clsx(
                    "px-3 py-2 cursor-pointer text-wrap min-w-[200px] break-all",
                    isSelected && "bg-primary text-white",
                    isFocused && !isSelected && "bg-primary-light text-primary-dark"
                ),
            }}
        />
    )
}

export default React.memo(SelectField) as typeof SelectField;
