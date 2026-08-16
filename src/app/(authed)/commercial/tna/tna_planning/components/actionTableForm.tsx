'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useTnaPlansForm } from "../config/useTnaPlansForm";
import ActionRow from "./actionRows";
import TableHeader, { type TableHeaderType} from "~/components/organisms/table/TableHeader";
import type { TNAPlanningFormValues } from "../config/formSchema";

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FieldArrayWithId<TNAPlanningFormValues>>[];
    rows: FieldArrayWithId<TNAPlanningFormValues>[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useTnaPlansForm>['methods'];
    validationError: FieldErrors<TNAPlanningFormValues>;
    handleAction?: (index: number) => void;
    register: ReturnType<typeof useTnaPlansForm>['methods']['register'];
}

const TableForm = (props: Props) => {
    const { columns, rows, register, disabled = false, name, methods, validationError } = props;

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
                                <ActionRow
                                    key={row.id}
                                    register={register}
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
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;