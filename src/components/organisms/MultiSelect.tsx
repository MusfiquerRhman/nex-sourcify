import clsx from "clsx";
import { clearIcon } from "~/assets";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

export interface Option {
    label: string;
    value: string | number | boolean;
}

interface Props {
    options: Option[];
    value: (string | number | boolean)[];
    onChange: (val: (string | number | boolean)[]) => void;
    error?: { message?: string };
    placeholder?: string;
    label: string;
    disabled?: boolean;
}

const MultiSelect: React.FC<Props> = ({ label, options, value = [], onChange, error, disabled, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const filtered = options?.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase()),
    );

    // Click outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if ( wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleValue = (val: string | number | boolean) => {
        if (value.includes(val)) {
            onChange(value?.filter((v) => v !== val));
        } else {
            onChange([...value, val]);
        }
    };

    return (
        <div ref={wrapperRef} className="w-full">
            <p className="py-0.5">{label}</p>
            <div onClick={() => setOpen((prev) => !prev)}
                className={clsx(
                    "emboss-inner flex min-h-[40px] cursor-pointer flex-wrap items-center gap-2 rounded-lg px-2 py-2",
                    error?.message ? "border-red-500" : "border-gray-300",
                )}
            >
                {value?.length === 0 && <span className="text-gray-400"> {placeholder} </span>}

                {/* Selected values */}
                {value && value.length > 0 && value.map((v, i) => {
                    const item = options.find((o) => o.value === v);
                    return (
                        <span key={i}
                            className="emboss flex items-center gap-2 rounded-lg px-3 py-1 text-sm text-black"
                        >
                            {item?.label}
                            <button className="text-primary hover:text-primary-dark"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleValue(v);
                                }}
                                disabled={disabled}
                            >
                                <Image src={clearIcon.src}
                                    alt="Remove" 
                                    className="h-6 w-6 hover:cursor-pointer disabled:cursor-not-allowed"
                                    width={20} height={20}
                                />
                            </button>
                        </span>
                    );
                })}
            </div>

            {/* Dropdown */}
            {(open && !disabled) && (
                 <div className="emboss absolute z-20 mt-4 mb-8 w-fit rounded-lg px-2 py-3 shadow-lg">
                    {/* Search input */}
                    <input type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search..."
                        className="emboss-inner mb-2 w-full rounded-lg p-2 text-sm outline-none"
                        autoFocus
                    />

                    {/* Options list */}
                    <div className="max-h-80 overflow-y-auto">
                        {filtered.map((opt, i) => (
                            <div key={i}
                                className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100"
                                onClick={() => toggleValue(opt.value)}
                            >
                                <input type="checkbox"
                                    readOnly
                                    checked={value?.includes(opt.value)}
                                    className="h-4 w-4"
                                    disabled={disabled}
                                />
                                {opt.label}
                            </div>
                        ))}

                        {filtered?.length === 0 && (
                            <p className="p-2 text-sm text-gray-400">No results</p>
                        )}
                    </div>
                </div>
            )}

            {error?.message && (
                <p className="mt-1 text-sm text-red-500">{error.message}</p>
            )}
        </div>
    );
};

export default React.memo(MultiSelect) as typeof MultiSelect;
