'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { BaseField } from "~/types/form";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import DistributionRows from "./distributionRows";
import type { useCommissionDistributionForm } from "../config/useCommissionDistributionForm";
import DistributionSummaryRow from "./distributionSummary";
import type { CommissionDistributionFormValues } from "../config/formSchema";

type Props = {
    fields: BaseField<string>[];
    validationError?: FieldErrors<CommissionDistributionFormValues>;
    disabled?: boolean;
    columns: TableHeaderType<FieldArrayWithId<CommissionDistributionFormValues>>[];
    name: string;
    rows: FieldArrayWithId<CommissionDistributionFormValues>[];
    title: string;
    methods: ReturnType<typeof useCommissionDistributionForm>['methods'];
}

const TableForm = (props: Props) => {
    const {title, columns, fields, rows, methods, disabled = false, validationError, name} =  props;


    return (
        <>
            <Heading as='h2' className="mx-8"> {title} </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((_, index) => (
                                <DistributionRows
                                    key={index}
                                    fields={fields}
                                    methods={methods}
                                    disabled={disabled}
                                    validationError={validationError ?? {}}
                                    name={name}
                                    index={index}
                                />
                            ))}
                            <DistributionSummaryRow methods={methods} />
                        </TableBody>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;