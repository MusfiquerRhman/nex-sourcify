'use client';

import React from "react";
import { GenericFormTableRow, Heading, TableBody, TableWrapper } from "~/components";
import { useWatch, type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useProceedRealizationForm } from "../config/useProceedRealizationForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { ProceedRealizationFormValues } from "../config/formSchema";
import { formFields as shipmentTableFormFields } from "../rdlInvoiceConfig/tableFormFields";
import { safeNumber } from "~/utils/numbers";
import { currencyFormatter } from "~/utils/localNumberStrings";

type RdlInvoiceRow = FieldArrayWithId<ProceedRealizationFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<RdlInvoiceRow>[];
    rows: RdlInvoiceRow[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useProceedRealizationForm>['methods'];
    validationError: FieldErrors<ProceedRealizationFormValues>;
}

const TableForm = (props: Props) => {
    const {columns, rows, disabled = false, name, methods, validationError} = props;

    const details = useWatch({ control: methods.control, name: 'details' });

    const totalInvoiceValue = details?.reduce(
        (sum, item) => sum = sum + (safeNumber(item?.invoice_value?.split(' ')[1]?.replaceAll(',', ''))), 0
    ) ?? 0;
    
    const totalProceedValue = details?.reduce((sum, item) => sum = sum + (item?.proceed_value ?? 0), 0) ?? 0;

    return (
        <>
            <Heading as ='h3' className="mx-8">
                Nex-Sourcify Invoice Details
            </Heading>
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
                                    validationError={validationError.details?.[index] ?? {}}
                                    name={name}
                                    control={methods.control}
                                    index={index}
                                />
                            ))}
                        </TableBody>
                        {totalInvoiceValue > 0 && <tfoot>
                            <tr className="font-bold text-sm border-2 border-gray/20">
                                <td colSpan={1} className="border-r-2 border-gray/20 p-2 text-right">Total</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{currencyFormatter(totalInvoiceValue, '$')}</td>
                                <td className="bg-secondary text-white border-r-2 border-gray/20 p-2">{currencyFormatter(safeNumber(totalProceedValue), '$')}</td>
                                <td className="border-r-2 border-gray/20 p-2" />
                            </tr>
                        </tfoot>}
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;