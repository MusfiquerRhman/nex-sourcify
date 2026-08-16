'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useCrossPaymentForm } from "../crossPaymentConfig/useCrossPaymentForm";
import FactoryInvoiceRows from "./CrossPaymentRows";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { CrossPaymentFormValues } from "../crossPaymentConfig/formSchema";

type ShipmentRow = FieldArrayWithId<CrossPaymentFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
    register: ReturnType<typeof useCrossPaymentForm>['methods']['register'];
    validationError: FieldErrors<CrossPaymentFormValues>;
    documentSubmissionId: string;
}

const TableForm = (props: Props) => {
    const {
        columns, 
        rows, 
        register, 
        disabled = false, 
        name, 
        methods, 
        validationError, 
        documentSubmissionId
    } =  props;

    return (
        <>
            <div className="flex flex-row items-center gap-4">
                <Heading as ='h3' className="mx-8">
                    Cross Payments
                </Heading>
            </div>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <FactoryInvoiceRows
                                    key={row.id}
                                    register={register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError}
                                    documentSubmissionId={documentSubmissionId}
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