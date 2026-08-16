'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useLCForm } from "../../config/useLCForm";
import ShipmentRows from "./ShipmentRows";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { FormValues } from "../../config/formSchema";

type ShipmentRow = FieldArrayWithId<FormValues>;

interface Props {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    title: string;
    name: string;
    methods: ReturnType<typeof useLCForm>['methods'];
    register: ReturnType<typeof useLCForm>['methods']['register'];
    validationError: FieldErrors<FormValues>;
    orderIndex: number;
}

const TableForm = (props: Props) => {
    const {
        title, 
        columns, 
        rows, 
        register, 
        disabled = false, 
        name, 
        methods, 
        validationError, 
        orderIndex,
    } =  props;

    return (
        <>
            <Heading as ='h2' className="mx-8">
                {title}
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <ShipmentRows
                                    key={row.id}
                                    register={register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError ?? {}}
                                    orderIndex={orderIndex}
                                />
                            ))}
                        </TableBody>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;