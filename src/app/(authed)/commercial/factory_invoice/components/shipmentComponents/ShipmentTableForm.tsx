'use client';

import React from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { useWatch, type FieldArrayWithId } from "react-hook-form";
import type { useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import ShipmentRows from "./ShipmentRows";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { FactoryInvoiceFormValues } from "../../config/formSchema";
import { quantityFormatter } from "~/utils/localNumberStrings";

type ShipmentRow = FieldArrayWithId<FactoryInvoiceFormValues>;

interface Props {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    title: string;
    name: string;
    removeRow: (index: number) => void;
    methods: ReturnType<typeof useFactoryInvoiceForm>['methods'];
    register: ReturnType<typeof useFactoryInvoiceForm>['methods']['register'];
}

const ShipmentTableForm = (props: Props) => {
    const { title, columns, rows, register, disabled = false, name, methods, removeRow } =  props;

    const details = useWatch({ control: methods.control, name: 'details' });

    const totalOrderQuantity = details?.reduce((sum, item) => sum = sum + (item?.order_quantity ?? 0), 0) ?? 0;
    const totalDeliveryQuantity = details?.reduce((sum, item) => sum = sum + (item?.delivery_quantity ?? 0), 0) ?? 0;
    const totalFactoryValue = details?.reduce((sum, item) => sum = sum + (item?.factory_value ?? 0), 0) ?? 0;

    return (
        <>
            <Heading as ='h2' className="mx-8">
                {title}
            </Heading>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <ShipmentRows
                                    key={row.id}
                                    register={register}
                                    disabled={disabled}
                                    removeRow={removeRow}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                />
                            ))}
                        </TableBody>
                        <tfoot>
                            <tr className="font-bold text-sm border-2 border-gray/20">
                                <td colSpan={5} className="border-r-2 border-gray/20 p-2 text-right">Total</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{quantityFormatter(totalOrderQuantity)}</td>
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{quantityFormatter(totalDeliveryQuantity)}</td>
                                <td className="border-r-2 border-gray/20 p-2" />
                                <td className="bg-secondary text-center text-white border-r-2 border-gray/20 p-2">{quantityFormatter(totalFactoryValue)}</td>
                            </tr>
                        </tfoot>
                    </TableWrapper>
                </div>
             </form>
        </>
    )
}

export default React.memo(ShipmentTableForm) as typeof ShipmentTableForm;