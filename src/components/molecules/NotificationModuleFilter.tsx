"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import type { NotificationModuleOption } from "~/types/notification";

type NotificationModuleFilterProps = {
    selectedModuleId: number | null;
    modules: NotificationModuleOption[];
    onChange: (moduleId: number | null) => void;
};

export default function NotificationModuleFilter(props: NotificationModuleFilterProps) {
    const { selectedModuleId, modules, onChange } = props;

    const [open, setOpen] = useState(false);
    const filterId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const moduleOptions = [{ value: null, label: "All modules" }, ...modules.map((module) => ({ value: module.id, label: module.name }))];
    const selectedLabel = moduleOptions.find((option) => option.value === selectedModuleId)?.label ?? "All modules";

    useEffect(() => {
        if (!open) return;

        containerRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();

        const handlePointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    const selectModule = (moduleId: number | null) => {
        onChange(moduleId);
        setOpen(false);
        triggerRef.current?.focus();
    };

    return (
        <div
            ref={containerRef}
            className="relative shrink-0"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
            }}
            onKeyDown={(event) => {
                if (event.key !== "Escape" || !open) return;

                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                triggerRef.current?.focus();
            }}
        >
            <button
                ref={triggerRef}
                type="button"
                aria-label={`Filter notifications by module: ${selectedLabel}`}
                aria-expanded={open}
                aria-controls={open ? filterId : undefined}
                title={`Filter by module: ${selectedLabel}`}
                onClick={() => setOpen((value) => !value)}
                className={clsx(
                    "focus-visible:outline-primary relative flex size-11 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                    selectedModuleId !== null || open ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                )}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5" aria-hidden="true">
                    <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {selectedModuleId !== null && <span className="bg-primary absolute top-0.5 right-0.5 size-1.5 rounded-full" aria-hidden="true" />}
            </button>
            {open && (
                <div
                    id={filterId}
                    className="absolute top-full right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
                >
                    <p className="px-2 pt-1 text-sm font-semibold text-gray-900">Filter by module</p>
                    <p className="px-2 pt-1 pb-2 text-xs text-gray-500">Applies to Pending and All</p>
                    <div role="radiogroup" aria-label="Notification module" className="max-h-[50dvh] space-y-0.5 overflow-y-auto">
                        {moduleOptions.map((option) => (
                            <label
                                key={option.value ?? "all"}
                                onPointerDown={(event) => event.preventDefault()}
                                className={clsx(
                                    "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-gray-300 focus-within:ring-inset hover:bg-gray-100",
                                    selectedModuleId === option.value ? "bg-primary/5 text-primary" : "text-gray-700",
                                )}
                            >
                                <input
                                    type="radio"
                                    name={filterId}
                                    value={option.value ?? ""}
                                    checked={selectedModuleId === option.value}
                                    onChange={() => selectModule(option.value)}
                                    className="accent-primary size-4 shrink-0 cursor-pointer"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
