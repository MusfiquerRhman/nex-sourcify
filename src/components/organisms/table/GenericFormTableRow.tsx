import clsx from "clsx";
import Image from "next/image";
import React from "react";
import { Controller } from "react-hook-form";
import type { Control, UseFormRegister, FieldValues, Path, FieldErrors } from "react-hook-form";
import { deleteIcon } from "~/assets";
import { CheckBox, SelectField, TableCell, TableRow, TextField, Toggle } from "~/components";
import type { BaseField } from "~/types/form";

type Props<T extends FieldValues> = {
    fields: BaseField<string>[];
    disabled?: boolean;
    removeRow?: (index: number) => void;
    validationError: {[key: string]: any};
    name: Path<T>;
    index: number;
    register: UseFormRegister<any>;
    control?: Control<any>;
    handleAction?: (index: number) => void;
    className?: string;
    canDelete?: boolean;
}

const GenericFormTableRow = <T extends FieldValues, >(props: Props<T>) => {
    const {fields, register, removeRow, disabled = false, validationError, name, control, index, handleAction, className, canDelete = true} =  props;

    return (
        <TableRow key={index} className={className}>
            {fields.map((col, colIndex) => (
                <TableCell key={colIndex} fixedLength={col.type !== 'checkbox'}>
                    {(() => {
                        const fieldName = `${name}.${index}.${col.name}`;
                        const validationMessage = validationError?.[index]?.[col.name]?.message;
                        const isDisabled = disabled || col.disabled;

                        switch (col.type) {
                            case "select":
                                return (
                                    <>
                                        <Controller name={fieldName as Path<T>} 
                                            control={control}
                                            render={({ field: selectField }) => (
                                                <SelectField
                                                    options={col.options}
                                                    value={selectField.value}
                                                    disabled={isDisabled}
                                                    onChange={selectField.onChange}
                                                    error={!!validationMessage}
                                                />
                                            )}
                                        />
                                        {validationMessage && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {validationMessage}
                                            </p>
                                        )}
                                    </>
                                );

                            case "number":
                            case "date": {
                                const registerOptions = col.type === "number" ? { valueAsNumber: true } : undefined;

                                return (
                                    <TextField
                                        {...register(fieldName, registerOptions)}
                                        type={col.type}
                                        name={fieldName}
                                        error={validationMessage as string | undefined}
                                        placeholder={col.placeholder}
                                        optional={col.optional}
                                        disabled={isDisabled}
                                        minDate={col.minDate}
                                    />
                                );
                            }

                            case 'toggle': 
                                    return (
                                        <Toggle
                                            {...register(fieldName)}
                                            label={col.label}
                                            checked={col.checked}
                                            disabled={isDisabled}
                                        />
                                    )

                            case 'button':
                                return (
                                    <button type="button" 
                                        className={clsx("px-4 py-2 text-white rounded-lg  focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2",
                                            !handleAction ? "opacity-50 cursor-not-allowed bg-gray-accent" : "hover:cursor-pointer bg-secondary hover:bg-primary-dark"
                                        )}
                                        // disabled={isDisabled}
                                        onClick={() => handleAction ? handleAction(index) : null}
                                        // disabled={disabled}
                                    >
                                        {col.label}
                                    </button>
                                )

                            case 'checkbox':
                                return (
                                    <Controller
                                        name={fieldName as Path<T>}
                                        control={control}
                                        render={({ field }) => (
                                            <CheckBox
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabled={isDisabled}
                                            />
                                        )}
                                    />
                                )

                            case 'text':
                                return (
                                    <Controller
                                        name={fieldName as Path<T>}
                                        control={control}
                                        render={({ field }) => (
                                            <p className="p-1 tracking-wide">{field.value}</p>
                                        )}
                                    />
                                )

                            default:
                                return (
                                    <>
                                        <textarea className={clsx(
                                                "w-full min-w-[200px] overflow-hidden rounded-lg p-2 outline-none focus:border-secondary-accent", 
                                                validationMessage ? "border-2 border-red-500" : "",
                                                (col?.disabled || disabled) ? "text-gray-600" : "border-gray-300 emboss-inner"
                                            )}
                                            rows={1}
                                            readOnly={disabled || col?.disabled}
                                            placeholder={col.placeholder}
                                            {...register(fieldName, {
                                                disabled: disabled || col?.disabled,
                                            })} 
                                        />
                                        {validationMessage && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {validationMessage}
                                            </p>
                                        )}
                                    </>
                                );
                        }
                    })()}
                </TableCell>
            ))}
            {canDelete && !disabled && removeRow && (
                <td className="w-fit">
                    <div className="flex flex-row justify-between items-center h-full text-[0.9rem] border-gray/20 w-fit p-2">
                        <button type="button" className="ml-2 w-4 h-full hover:cursor-pointer" onClick={() => removeRow(index)}>
                            <Image  width={20} height={20} src={deleteIcon.src} alt="Delete" />
                        </button>
                    </div>
                </td>
            )}
        </TableRow>
    )
}

export default React.memo(GenericFormTableRow) as typeof GenericFormTableRow;