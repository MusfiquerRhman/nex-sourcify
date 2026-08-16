'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId } from "react-hook-form";
import type { useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import ShipmentRows from "./ShipmentRows";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { FactoryInvoiceFormValues } from "../../config/formSchema";

type ShipmentRow = FieldArrayWithId<FactoryInvoiceFormValues>;

interface Props {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    title: string;
    name: string;
    removeRow: (index: number) => void;
    methods: ReturnType<typeof useFactoryInvoiceForm>['methods'];
    register: ReturnType<typeof useFactoryInvoiceForm>['methods']['register'];
}

const ShipmentTableForm = (props: Props) => {
    const { title, columns, rows, register, disabled = false, name, methods, removeRow } =  props;

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
                                    removeRow={removeRow}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                />
                            ))}
                        </TableBody>
                    </TableWrapper>
                </div>
             </form>
        </>
    )
}

export default React.memo(ShipmentTableForm) as typeof ShipmentTableForm;