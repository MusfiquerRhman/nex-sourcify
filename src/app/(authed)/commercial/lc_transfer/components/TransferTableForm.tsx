/**
 * @description
 * This component renders the LC Transfer details in a table format using the TableForm component. 
 * 
 * @params
 * - methods: The methods object from useLCTransferForm, providing access to form control and state.
 * - validationError: An object containing validation errors for the form fields, used to display error messages for each detail row.
 * - disabled: A boolean to disable the form fields when necessary, such as when the LC Transfer is in a non-editable state.
 * - isEdit: A boolean to indicate whether the form is in edit mode.
 * - columns: An array of column definitions for the table, used to render the table header.
 * - rows: An array of LC Transfer detail objects, used to render the table body.
 * - addRow: A function to add a new LC Transfer detail row to the form.
 * - removeRow: A function to remove an existing LC Transfer detail row from the form.
 * - name: The name of the form field for the LC Transfer details, used for react-hook-form.
 * - register: The register function from useLCTransferForm for registering form fields in each detail row.
 */

'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import { plusIcon } from "~/assets";
import TransferRow from "./TransferRows";
import TableHeader, { type TableHeaderType} from "~/components/organisms/table/TableHeader";
import Image from "next/image";
import type { LCTransferFormValues } from "../config/formSchema";
import type { useLCTransferForm } from "../config/useLcTransferForm";
import TransferSummaryRow from "./TransferSummaryRow";

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FieldArrayWithId<LCTransferFormValues>>[];
    rows: FieldArrayWithId<LCTransferFormValues>[];
    disabled?: boolean;
    addRow: () => void;
    removeRow: (index: number) => void;
    name: string;
    methods: ReturnType<typeof useLCTransferForm>['methods'];
    validationError: FieldErrors<LCTransferFormValues>;
    register: ReturnType<typeof useLCTransferForm>['methods']['register'];
    isEdit?: boolean;
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
        isEdit
    } =  props;

    return (
        <>
            <Heading as ='h2' className="mx-8">
                Transfer Details
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <TransferRow
                                    key={row.id}
                                    register={register}
                                    removeRow={removeRow}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError}
                                />
                            ))}
                            <TransferSummaryRow methods={methods}/>
                        </TableBody>
                    </TableWrapper>
                </div>
                {!disabled && !isEdit && (
                    <button type="button"
                        onClick={() => addRow()}
                        className="group w-fit bg-gray-light ml-1 rounded-full px-4 py-2 mt-4 text-gray-dark hover:cursor-pointer hover:bg-gray hover:text-white"
                    >
                        <Image width={20} height={20} src={plusIcon.src} alt="Add more" className="inline-block mr-2 h-4 invert group-hover:invert-0" /> 
                        Add more
                    </button>
                )}
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;