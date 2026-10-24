import clsx from "clsx";
import Image from "next/image";
import React from "react";
import { Controller } from "react-hook-form";
import type { Control, UseFormRegister, FieldValues, Path } from "react-hook-form";
import { copyIcon, deleteIcon } from "~/assets";
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
    copyRow?: (index: number) => void;
    className?: string;
    canDelete?: boolean;
    onCheckboxChange?: (fieldName: string, checked: boolean, index: number) => void;
}

const GenericFormTableRow = <T extends FieldValues, >(props: Props<T>) => {
    const {fields, register, removeRow, disabled = false, validationError, name, control, index, handleAction, copyRow, className, canDelete = true, onCheckboxChange} =  props;

    return (
        <TableRow key={index} className={className}>
            {fields.map((col, colIndex) => (
                <TableCell key={colIndex} fixedLength={col.type !== 'checkbox' && col.name !== 'serial_no'} className={col.freeze ? 'freeze-col' : ''}>
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
                                        onClick={() => handleAction ? handleAction(index) : null}
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
                                                onChange={(checked) => {
                                                    field.onChange(checked);
                                                    onCheckboxChange?.(col.name, checked, index);
                                                }}
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

                            case 'chip-primary':
                                return (
                                    <Controller
                                        name={fieldName as Path<T>}
                                        control={control}
                                        render={({ field }) => (
                                            <p className="rounded-full text-white w-fit py-[3px] px-4 max-w-40 text-[0.75rem] bg-secondary">{field.value}</p>
                                        )}
                                    />
                                )
                            
                            case 'chip-error':
                                return (
                                    <Controller
                                        name={fieldName as Path<T>}
                                        control={control}
                                        render={({ field }) => (
                                            <p className="rounded-full text-white w-fit py-[3px] px-4 max-w-40 text-[0.75rem] bg-red">{field.value}</p>
                                        )}
                                    />
                                )

                            default:
                                return (
                                    <>
                                        <textarea rows={1}
                                            className={clsx(
                                                "w-full min-w-[160px] overflow-hidden rounded-lg p-2 outline-none focus:border-secondary-accent", 
                                                validationMessage ? "border-2 border-red-500" : "",
                                                (col?.disabled || disabled) ? "text-gray-600" : "border-gray-300 emboss-inner"
                                            )}
                                            readOnly={disabled || col?.disabled}
                                            placeholder={col.placeholder}
                                            {...register(fieldName, { disabled: disabled || col?.disabled })} 
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
            {!disabled && (copyRow || (canDelete && removeRow)) && (
                <td className="w-fit">
                    <div className="flex flex-row justify-between items-center h-full text-[0.9rem] border-gray/20 w-fit p-2">
                        {copyRow && (
                            <button
                                type="button"
                                className="mr-2 w-4 h-full hover:cursor-pointer"
                                onClick={() => copyRow(index)}
                                aria-label="Copy shipment row"
                                title="Copy shipment row"
                            >
                                <Image  width={20} height={20} src={copyIcon.src} alt="copy" />
                            </button>
                        )}
                        {canDelete && removeRow && (
                            <button type="button" className="ml-2 w-4 h-full hover:cursor-pointer" onClick={() => removeRow(index)}>
                                <Image  width={20} height={20} src={deleteIcon.src} alt="Delete" />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </TableRow>
    )
}

export default React.memo(GenericFormTableRow) as typeof GenericFormTableRow;
