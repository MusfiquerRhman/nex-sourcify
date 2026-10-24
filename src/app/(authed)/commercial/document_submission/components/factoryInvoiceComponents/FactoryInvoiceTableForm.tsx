'use client';

import React from "react";
import { GenericFormTableRow, Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { DocumentSubmissionFormValues } from "../../config/formSchema";
import { formFields as shipmentTableFormFields } from "../../factoryInvoiceConfig/tableFormFields";
import { safeNumber } from "~/utils/numbers";

type ShipmentRow = FieldArrayWithId<DocumentSubmissionFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: FieldErrors<DocumentSubmissionFormValues>;
    invoiceIndex: number;
    selectedRdlInvoiceNo: string;
}

const TableForm = (props: Props) => {
    const {columns, rows, disabled = false, name, methods, validationError, invoiceIndex, selectedRdlInvoiceNo} = props;
    const factoryInvoices = methods.watch(`rdlInvoices.${invoiceIndex}.factoryInvoices`) ?? [];
    const totalQuantity = factoryInvoices.reduce(
        (total, factoryInvoice) => total + safeNumber(factoryInvoice.quantity),
        0,
    );
    const totalValue = factoryInvoices.reduce(
        (total, factoryInvoice) => total + safeNumber(factoryInvoice.factory_invoice_value),
        0,
    );

    return (
        <>
            <div className="flex flex-row items-center gap-4">
                <Heading as ='h3' className="mx-8">
                    {invoiceIndex + 1}. Factory Invoice Details of
                    <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                        {selectedRdlInvoiceNo}
                    </span>
                </Heading>
            </div>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <GenericFormTableRow
                                    key={row.id}
                                    fields={shipmentTableFormFields()}
                                    register={methods.register}
                                    disabled={disabled}
                                    validationError={validationError?.rdlInvoices?.[invoiceIndex]?.factoryInvoices ?? {}}
                                    name={name}
                                    control={methods.control}
                                    index={index}
                                />
                            ))}
                        </TableBody>
                        <tfoot>
                            <tr className="font-bold text-sm border-2 border-gray/20">
                                <td colSpan={4} className="border-r-2 border-gray/20 p-2 text-right">Total</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalQuantity}</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalValue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;