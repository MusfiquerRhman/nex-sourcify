'use client';

import React from "react";
import { GenericFormTableRow, Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useOrderChecklistForm } from "../config/useOrderChecklistForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { OrderChecklistFormValues } from "../config/formSchema";
import { useTableFormFields } from "../listConfig/tableFormFields";
import { formatDateForInput } from "~/utils/localDateString";

type ShipmentRow = FieldArrayWithId<OrderChecklistFormValues>;

type Props = {
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    name: 'details';
    methods: ReturnType<typeof useOrderChecklistForm>['methods'];
    validationError: FieldErrors<OrderChecklistFormValues>;
}

const TableForm = (props: Props) => {
    const { columns, rows, disabled = false, name, methods, validationError } = props;

    const fields = useTableFormFields();

    const handleCheckboxChange = (fieldName: string, checked: boolean, index: number) => {
        if (fieldName !== 'technical_check' && fieldName !== 'qa_check') return;

        const dateField = fieldName === 'technical_check' ? 'technical_check_date' : 'qa_check_date';
        methods.setValue(`details.${index}.${dateField}`, checked ? formatDateForInput(new Date()) : '', {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    return (
        <>
            <Heading as ='h3' className="mx-8">
                Checklist
            </Heading>
            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <GenericFormTableRow
                                    key={row.id}
                                    fields={fields}
                                    register={methods.register}
                                    disabled={disabled}
                                    validationError={validationError.details ?? {}}
                                    name={name}
                                    control={methods.control}
                                    index={index}
                                    canDelete={false}
                                    onCheckboxChange={handleCheckboxChange}
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
