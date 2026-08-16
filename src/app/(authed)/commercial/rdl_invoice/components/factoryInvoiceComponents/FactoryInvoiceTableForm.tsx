'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { useWatch, type FieldErrors } from "react-hook-form";
import { plusIcon } from "~/assets";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import TableHeader, { type TableHeaderType} from "~/components/organisms/table/TableHeader";
import Image from "next/image";
import type { RDLInvoiceFormValues } from "../../config/formSchema";
import FactoryInvoiceRows from "./FactoryInvoiceRows";

type FactoryInvoiceDetailRow = NonNullable<RDLInvoiceFormValues['details']>[number] & {
    id: string;
};

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FactoryInvoiceDetailRow>[];
    rows: FactoryInvoiceDetailRow[];
    disabled?: boolean;
    addRow: () => void;
    removeRow: (index: number) => void;
    name: string;
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: FieldErrors<RDLInvoiceFormValues>;
    handleAction?: (index: number) => void;
    register: ReturnType<typeof useRDLInvoiceForm>['methods']['register'];
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

    const invoiceType = useWatch({
        control: methods.control,
        name: `invoice_type`,
    });

    // only show add button for club factory invoice type or if there are no factory invoice details added yet in case of single
    const numberOfFactoryInvoiceDetails = useWatch({
        control: methods.control,
        name: `details`,
    })?.length;

    const showAddButton = invoiceType || (!invoiceType && numberOfFactoryInvoiceDetails === 0);

    return (
        <>
            <Heading as ='h2' className="mx-8">
                Factory Invoices
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
                    </TableWrapper>
                </div>
                {!disabled && showAddButton && 
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