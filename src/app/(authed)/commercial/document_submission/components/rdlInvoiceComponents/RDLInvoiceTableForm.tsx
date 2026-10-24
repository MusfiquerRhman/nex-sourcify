'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { useWatch, type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import { plusIcon } from "~/assets";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import TableHeader, { type TableHeaderType} from "~/components/organisms/table/TableHeader";
import Image from "next/image";
import type { DocumentSubmissionFormValues } from "../../config/formSchema";
import FactoryInvoiceRows from "./RDLInvoiceRows";
import { safeNumber } from "~/utils/numbers";

type RdlInvoiceArrayPath = "rdlInvoices";
type RdlInvoiceRowValues = FieldArrayWithId<DocumentSubmissionFormValues, RdlInvoiceArrayPath>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<RdlInvoiceRowValues>[];
    rows: RdlInvoiceRowValues[];
    disabled?: boolean;
    addRow: () => void;
    removeRow: (index: number) => void;
    name: string;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: FieldErrors<DocumentSubmissionFormValues>;
    handleAction?: (index: number) => void;
    register: ReturnType<typeof useDocumentSubmissionForm>['methods']['register'];
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
    } =  props;

    const rdlInvoices = useWatch({ control: methods.control, name: `rdlInvoices`}) ?? [];

    // const rdlInvoices = methods.watch("rdlInvoices") ?? [];

    const totalQuantity = rdlInvoices.reduce(
        (total, rdlInvoice) => total + safeNumber(rdlInvoice.quantity),
        0,
    );
    const totalRdlValue = rdlInvoices.reduce(
        (total, rdlInvoice) => total + safeNumber(rdlInvoice.rdl_value),
        0,
    );
    const totalPreviouslyReceivedValue = rdlInvoices.reduce(
        (total, rdlInvoice) => total + safeNumber(rdlInvoice.previously_received_rdl_value),
        0,
    );
    const totalReceivedValue = rdlInvoices.reduce(
        (total, rdlInvoice) => total + safeNumber(rdlInvoice.received_rdl_value),
        0,
    );

    return (
        <>
            <Heading as ='h2' className="mx-8">
                NexSourcify Invoices
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <FactoryInvoiceRows
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
                        </TableBody>
                        <tfoot>
                            <tr className="font-bold text-sm border-2 border-gray/20">
                                <td colSpan={2} className="border-r-2 border-gray/20 p-2 text-right">Total</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalQuantity.toFixed(2)}</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalRdlValue.toFixed(2)}</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalPreviouslyReceivedValue.toFixed(2)}</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalReceivedValue.toFixed(2)}</td>
                                <td className="border-r-2 border-gray/20 p-2" />
                            </tr>
                        </tfoot>
                    </TableWrapper>
                </div>
                {!disabled && 
                    <button type="button"
                        onClick={() => addRow()}
                        className="group w-fit bg-gray-light ml-1 rounded-full px-4 py-2 mt-4 text-gray-dark hover:cursor-pointer hover:bg-gray hover:text-white"
                    >
                        <Image width={20} height={20} src={plusIcon.src} alt="Add more" className="inline-block mr-2 h-4 invert group-hover:invert-0" /> 
                        Add more
                    </button>
                }
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;