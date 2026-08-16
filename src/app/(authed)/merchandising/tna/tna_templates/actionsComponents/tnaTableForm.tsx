'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import { plusIcon } from "~/assets";
import type { useTnaForm } from "../config/useTnaForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import TnaActionRow from "./tnaActionsRows";
import Image from "next/image";
import type { FormValues } from "../config/formSchema";

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FieldArrayWithId<FormValues>>[];
    rows: FieldArrayWithId<FormValues>[];
    disabled?: boolean;
    addRow: () => void;
    removeRow: (index: number) => void;
    name: string;
    methods: ReturnType<typeof useTnaForm>['methods'];
    validationError: FieldErrors<FormValues>;
    handleAction?: (index: number) => void;
    register: ReturnType<typeof useTnaForm>['methods']['register'];
}

const TableForm = (props: Props) => {
    const {
        columns, 
        rows, 
        register, 
        addRow, 
        removeRow, 
        disabled = false, 
        name, 
        methods, 
        validationError, 
    } =  props;

    return (
        <>
            <Heading as ='h2' className="mx-8">
                Actions
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <TnaActionRow
                                    key={row.id}
                                    register={register}
                                    removeRow={removeRow}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError}
                                />
                            ))}
                        </TableBody>
                    </TableWrapper>
                </div>
                {!disabled && 
                    <button type="button"
                        onClick={() => addRow()}
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