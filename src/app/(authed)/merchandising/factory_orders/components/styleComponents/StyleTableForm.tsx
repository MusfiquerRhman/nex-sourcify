'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors, type FieldValues } from "react-hook-form";
import StyleSummaryRow from "./StyleSummaryRow";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import StyleRow from "./StyleRows";
import type { FactoryOrderFormValues } from "../../config/formSchema";

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FieldArrayWithId<FactoryOrderFormValues>>[];
    rows: FieldArrayWithId<FactoryOrderFormValues>[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues>;
    register: ReturnType<typeof useFactoryOrderForm>['methods']['register'];
}

const TableForm = (props: Props) => {
    const { columns,  rows,  register,  disabled = false,  name,  methods,  validationError } =  props;

    return (
        <>
            <Heading as ='h2' className="mx-8">
                Styles Details
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <StyleRow
                                    key={row.id}
                                    register={register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError}
                                />
                            ))}
                            <StyleSummaryRow methods={methods} />
                        </TableBody>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;