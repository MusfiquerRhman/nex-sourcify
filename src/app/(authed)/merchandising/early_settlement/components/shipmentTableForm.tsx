'use client';

import React from "react";
import { GenericFormTableRow, Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useEarlySettlementForm } from "../config/useEarlySettlementForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { EarlySettlementFormValues } from "../config/formSchema";
import { formFields as shipmentTableFormFields } from "../shipmentConfig/tableFormFields";
import type { GetEarlySettlementPoTotalsTypes } from "~/types/merchandisingAPITypes";
import ShipmentSummaryRow from "./ShipmentSummaryRow";

type ShipmentRow = FieldArrayWithId<EarlySettlementFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useEarlySettlementForm>['methods'];
    validationError: FieldErrors<EarlySettlementFormValues>;
    totals: GetEarlySettlementPoTotalsTypes | undefined;
}

const TableForm = (props: Props) => {
    const {columns, rows, disabled = false, name, methods, validationError, totals} = props;

    return (
        <>
            <Heading as ='h3' className="mx-8">
                PO Details
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
                                    validationError={validationError.pos?.[index] ?? {}}
                                    name={name}
                                    control={methods.control}
                                    index={index}
                                />
                            ))}
                        </TableBody>
                        <tfoot>
                            <ShipmentSummaryRow totals={totals}/>
                        </tfoot>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;