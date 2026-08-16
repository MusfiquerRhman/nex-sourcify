'use client';

import React from "react";
import { Heading, Loader, TableBody, TableHead, TableHeadCells, TableWrapper, GenericFormTableRow } from "~/components";
import { type Control, type FieldArrayWithId, type FieldValues, type Path, type UseFormRegister } from "react-hook-form";
import { plusIcon } from "~/assets";
import type { BaseField } from "~/types/form";
import Image from "next/image";

type TableHeader<T> = {
    key: keyof T | string;
    label: string;
    type?: string;
};

type Props<T extends FieldValues> = {
    fields: BaseField<string>[];
    validationError?: {[key: string]: any};
    isLoading?: boolean;
    error?: string | null;
    disabled?: boolean;
    control?: Control<T>;
    columns: TableHeader<T>[];
    name: string;
    rows: FieldArrayWithId<T>[];
    addRow?: () => void;
    canDelete?: boolean;
    removeRow?: (index: number) => void;
    title: string;
    register: UseFormRegister<T>;
    handleAction?: (index: number) => void;
}
    
const TableForm = <T extends FieldValues, >(props: Props<T>) => {
    const {title, isLoading, error, columns, fields, rows, register, addRow, removeRow, disabled = false, validationError, name, control, canDelete = true, handleAction} =  props;
    
    if(isLoading) return <Loader />

    return (
        <>
            {error && (
                <div className="w-[calc(100%-1rem)] p-4 m-2 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>Error: {error}</p>
                </div>
            )}

            <Heading as='h2' className="mx-8"> {title} </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        {rows.length !== 0 ? (
                            <TableHead>
                                <tr>
                                    {columns.map((col, index) => (
                                        <TableHeadCells key={index} isAction={col.type === 'action'}>
                                            {col.label}
                                        </TableHeadCells>
                                    ))}
                                </tr>
                            </TableHead>
                        ) : (
                            <TableHead variant="placeholder">
                                <tr className="w-full text-center p-4">
                                    <td colSpan={columns.length} className="p-2">No Data</td>
                                </tr>
                            </TableHead>
                        )}
                        <TableBody>
                            {rows.map((_, index) => (
                                <GenericFormTableRow
                                    canDelete={canDelete}
                                    key={index}
                                    fields={fields}
                                    register={register}
                                    removeRow={removeRow}
                                    disabled={disabled}
                                    validationError={validationError ?? {}}
                                    name={name}
                                    control={control}
                                    index={index}
                                    handleAction={handleAction}
                                />
                            ))}
                        </TableBody>
                    </TableWrapper>
                </div>
                {(addRow && !disabled )&& 
                    <button type="button"
                        onClick={() => addRow?.()}
                        className="group w-fit bg-gray-light ml-1 rounded-full px-4 py-2 mt-4 text-gray-dark hover:cursor-pointer hover:bg-gray hover:text-white"
                    >
                        <Image width={20} height={20} src={plusIcon.src} alt="Add more" className="inline-block mr-2 h-4 invert group-hover:invert-0" /> 
                        Add more
                    </button>
                }
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;