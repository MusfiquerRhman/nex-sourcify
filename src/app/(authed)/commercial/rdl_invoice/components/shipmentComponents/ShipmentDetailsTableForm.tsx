'use client';

import React from "react";
import { TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { RDLInvoiceFormValues } from "../../config/formSchema";
import ShipmentRows from "./ShipmentRows";

type ShipmentRow = FieldArrayWithId<RDLInvoiceFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    title: React.JSX.Element;
    name: string;
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: FieldErrors<RDLInvoiceFormValues>;
    invoiceIndex: number;
}

const TableForm = (props: Props) => {
    const {
        title, 
        columns, 
        rows, 
        disabled = false, 
        name, 
        methods, 
        validationError, 
        invoiceIndex,
    } =  props;

    return (
        <>
            {title}

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <ShipmentRows 
                                    key={row.id}
                                    register={methods.register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods}
                                    validationError={validationError}
                                    invoiceIndex={invoiceIndex}
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