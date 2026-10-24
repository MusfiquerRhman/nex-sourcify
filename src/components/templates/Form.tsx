import React from "react";

import { Loader, Toggle, FormSelect, TextField, Button, MultiSelect, CheckBox, Label} from '~/components'
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path, UseFormRegister } from "react-hook-form";
import type { BaseField } from "~/types/form";

type Props<T extends FieldValues> = {
    fields: BaseField<string>[];
    onSubmit?: React.FormEventHandler<HTMLFormElement>;
    buttonLabel: string;
    secondaryActions?: React.ReactNode;
    register: UseFormRegister<T>;
    validationError: {[key: string]: any};
    isLoading?: boolean;
    error?: string | null;
    disabled?: boolean;
    control?: Control<T>;
    name?: Path<T>;
}

// Form component to render dynamic form fields based on configuration
const Form = <T extends FieldValues, >(props: Props<T>) => {
    const { fields, onSubmit, buttonLabel, secondaryActions, register, validationError, isLoading, error, disabled, control, name } = props;

    if(isLoading) return <Loader/>

    return (
        <>
            {error && (
                <div className="w-[calc(100%-1rem)] p-4 m-2 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>Error: {error}</p>
                </div>
            )}
            <form onSubmit={onSubmit} className="nex-form flex w-full min-w-0 flex-col justify-center p-5 sm:p-8">
                {/* Main dynamic layout grid */}
                <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-x-6 gap-y-5">
                    {fields.map((field, index) => (
                        <React.Fragment key={index}>
                            {(() => {
                                const fieldName = name ? `${name}.${field.name}` : field.name;
                                const validationMessage = validationError[field.name]?.message;
                                const isDisabled = disabled || field.disabled;

                                switch (field.type) {
                                    case "select":
                                        return (
                                            <Controller
                                                name={fieldName as Path<T>} 
                                                control={control}
                                                render={({ field: selectField }) => (
                                                    <FormSelect
                                                        label={field.label}
                                                        name={fieldName}
                                                        options={field.options}
                                                        value={selectField.value}
                                                        onChange={selectField.onChange}
                                                        disabled={isDisabled}
                                                        error={validationMessage}
                                                        optional={field.optional}
                                                    />
                                                )}
                                            />
                                        );

                                    case "email":
                                    case "date":
                                    case "number": 
                                        return (
                                            <TextField
                                                {...register(fieldName as Path<T>, {
                                                    ...(field.type === "number" && { valueAsNumber: true }),
                                                })}
                                                type={field.type}
                                                name={fieldName}
                                                label={field.label}
                                                error={validationMessage}
                                                placeholder={field.placeholder}
                                                optional={field.optional}
                                                disabled={isDisabled}
                                                minDate={field.minDate}
                                            />
                                        );
                                    
                                    case 'toggle': 
                                        return (
                                            <Toggle
                                                {...register(fieldName as Path<T>)}
                                                label={field.label}
                                                checked={field.checked}
                                                disabled={isDisabled}
                                            />
                                        )

                                    case 'multiselect':
                                        return (
                                            <Controller
                                                name={fieldName as Path<T>}
                                                control={control}
                                                render={({ field: controllerField }) => (
                                                    <MultiSelect
                                                        label={field.label}
                                                        options={field.options ?? []}
                                                        value={controllerField.value ?? []}
                                                        placeholder={field.placeholder}
                                                        onChange={controllerField.onChange}
                                                        error={validationMessage}
                                                        disabled={isDisabled}
                                                    />
                                                )}
                                            />
                                        )

                                    case 'checkbox':
                                        return (
                                            <div className="col-span-full flex items-center gap-3 p-2 min-h-10 max-w-md">
                                                <Controller
                                                    name={fieldName as Path<T>}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <div className="flex items-center justify-center h-5 w-5">
                                                            <CheckBox
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                            />
                                                        </div>
                                                    )}
                                                />
                                                <Label
                                                    htmlFor={fieldName}
                                                    label={field.label}
                                                    optional={field.optional}
                                                    className="cursor-pointer select-none text-sm font-medium"
                                                />
                                            </div>
                                        )

                                    default:
                                        return (
                                            <TextField
                                                {...register(fieldName as Path<T>)}
                                                name={fieldName}
                                                label={field.label}
                                                error={validationMessage}
                                                placeholder={field.placeholder}
                                                optional={field.optional}
                                                disabled={isDisabled}
                                            />
                                        );
                                }
                            })()}
                        </React.Fragment>
                    ))}
                </div>
                {(!disabled && !!onSubmit) && <div className="nex-form-actions mt-7 flex w-full flex-wrap items-center justify-end gap-3">
                    {secondaryActions}
                    <Button type="submit" 
                        label={buttonLabel} 
                        className="nex-form-submit max-w-80"
                        disabled={isLoading}
                    />
                </div>}
            </form>
        </>
    )
}

export default React.memo(Form) as typeof Form;
