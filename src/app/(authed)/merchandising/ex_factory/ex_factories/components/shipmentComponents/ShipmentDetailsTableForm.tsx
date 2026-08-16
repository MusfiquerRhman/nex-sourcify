'use client';

import React from "react";
import { TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useExfactoryForm } from "../../config/useExfactoryForm";
import ShipmentRows from "./ShipmentRows";
import ShipmentSummaryRow from "./ShipmentSummaryRow";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { ExFactoryFormValues } from "../../config/formSchema";

type ShipmentRow = FieldArrayWithId<ExFactoryFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    title: React.JSX.Element;
    name: string;
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    register: ReturnType<typeof useExfactoryForm>['methods']['register'];
    validationError: FieldErrors<ExFactoryFormValues>;
    orderIndex: number;
    removeRow: (index: number) => void;
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
        removeRow
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
                                    register={register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    removeRow={removeRow}
                                    validationError={validationError}
                                    orderIndex={orderIndex}
                                />
                            ))}
                            <ShipmentSummaryRow methods={methods} orderIndex={orderIndex} />
                        </TableBody>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;