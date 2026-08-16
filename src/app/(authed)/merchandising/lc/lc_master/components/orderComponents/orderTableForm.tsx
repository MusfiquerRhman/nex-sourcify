'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import { plusIcon } from "~/assets";
import type { useLCForm } from "../../config/useLCForm";
import OrderRow from "./orderRows";
import TableHeader, { type TableHeaderType} from "~/components/organisms/table/TableHeader";
import Image from "next/image";
import type { FormValues } from "../../config/formSchema";

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FieldArrayWithId<FormValues>>[];
    rows: FieldArrayWithId<FormValues>[];
    disabled?: boolean;
    addRow: () => void;
    removeRow: (index: number) => void;
    name: string;
    methods: ReturnType<typeof useLCForm>['methods'];
    validationError: FieldErrors<FormValues>;
    handleAction?: (index: number) => void;
    register: ReturnType<typeof useLCForm>['methods']['register'];
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
        handleAction
    } =  props;

    return (
        <>
            <Heading as ='h2' className="mx-8">
                Order Details
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <OrderRow
                                    key={row.id}
                                    register={register}
                                    removeRow={removeRow}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError}
                                    handleAction={handleAction}
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