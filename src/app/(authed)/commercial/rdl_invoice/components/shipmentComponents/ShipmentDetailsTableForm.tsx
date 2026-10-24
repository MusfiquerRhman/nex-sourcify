'use client';

import React from "react";
import { TableBody, TableWrapper } from "~/components";
import { useWatch, type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { RDLInvoiceFormValues } from "../../config/formSchema";
import ShipmentRows from "./ShipmentRows";
import { safeNumber } from "~/utils/numbers";

type ShipmentRow = FieldArrayWithId<RDLInvoiceFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    title: React.JSX.Element;
    name: string;
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: FieldErrors<RDLInvoiceFormValues>;
    invoiceIndex: number;
}

const TableForm = (props: Props) => {
    const {
        title, 
        columns, 
        rows, 
        disabled = false, 
        name, 
        methods, 
        validationError, 
        invoiceIndex,
    } =  props;

    const shipmentDetails = useWatch({ control: methods.control, name: `details.${invoiceIndex}.factoryInvoiceDetails`});

    const totalShipmentQuantity = shipmentDetails?.reduce((sum, item) => sum = sum + (item?.order_quantity ?? 0), 0) ?? 0;
    const totalPreviousQuantity = shipmentDetails?.reduce((sum, item) => sum = sum + (item?.previous_quantity ?? 0), 0) ?? 0;
    const totalInvoiceQuantity = shipmentDetails?.reduce((sum, item) => sum = sum + (item?.invoice_quantity ?? 0), 0) ?? 0;
    const totalRdlValue = shipmentDetails?.reduce((sum, item) => sum = sum + (safeNumber(item?.invoice_value) ?? 0), 0) ?? 0;

    return (
        <>
            {title}

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <ShipmentRows 
                                    key={row.id}
                                    register={methods.register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods}
                                    validationError={validationError}
                                    invoiceIndex={invoiceIndex}
                                />
                            ))}
                        </TableBody>
                        <tfoot>
                            <tr className="font-bold text-sm border-2 border-gray/20">
                                <td colSpan={4} className="border-r-2 border-gray/20 p-2 text-right">Total</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalShipmentQuantity}</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalPreviousQuantity}</td>
                                <td className="bg-secondary text-white border-r-2 border-gray/20 p-2">{totalInvoiceQuantity}</td>
                                <td className="border-r-2 border-gray/20 p-2" />
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{totalRdlValue}</td>
                            </tr>
                        </tfoot>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;