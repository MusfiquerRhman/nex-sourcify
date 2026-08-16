'use client';

import React, { useEffect } from "react";
import { Heading, TableBody, TableWrapper } from "~/components";
import { useWatch, type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useDebitNoteForm } from "../config/useDebitNoteForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { DebitNoteFormValues } from "../config/formSchema";
import { plusIcon } from "~/assets";
import Image from "next/image";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import DebitNoteDetailsRow from "./DebitNoteDetailsRow";
import ShipmentSummaryRow from "./ShipmentSummaryRow";

type ShipmentRow = FieldArrayWithId<DebitNoteFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useDebitNoteForm>['methods'];
    validationError: FieldErrors<DebitNoteFormValues>;
    addRow: () => void;
    removeRow: (index: number) => void;
}

const TableForm = (props: Props) => {
    const {columns, rows, disabled = false, name, methods, validationError, addRow, removeRow} = props;

    const lc_sc_id = methods.watch("lc_sc_id");
    const term_id = methods.watch("term_id");
    const factory_id = methods.watch("factory_id");

    const debitNoteId = useWatch({ control: methods.control, name: `db_id`});

    const { data: shipmentDetails } = api.debitNotes.getShipmentDetailsForDebitNote.useQuery(
        (!!lc_sc_id && !!term_id && !!factory_id) 
            ? { lc_sc_id, term_id: Number(term_id), factory_id: Number(factory_id), debit_note_id: debitNoteId } 
            : skipToken,
    );

    const details = useWatch({ control: methods.control, name: "details" });
    
    useEffect(() => {
        if (!shipmentDetails) return;
        
        details?.forEach((detail, index) => {
            if (!detail.exfactory_shipment_id) return;
            
            const shipment = shipmentDetails.find(
                (item) => item.id === detail.exfactory_shipment_id,
            );

            if (!shipment) return;

            const poNoPath = `details.${index}.po_no` as const;
            const factoryInvoiceNoPath = `details.${index}.factory_invoice_no` as const;
            const valuePath = `details.${index}.value` as const;

            if (methods.getValues(poNoPath) !== shipment.buyer_po) {
                methods.setValue(poNoPath, shipment.buyer_po);
            }

            if (methods.getValues(factoryInvoiceNoPath) !== shipment.invoice_no) {
                methods.setValue(factoryInvoiceNoPath, shipment.invoice_no);
            }

            const dnValue = Number(shipment.dn_value);
            const dnValueStr = dnValue.toFixed(2);
            if (methods.getValues(valuePath) !== dnValueStr) {
                methods.setValue(valuePath, dnValueStr);
            }
        });
    }, [details, shipmentDetails, methods]);
    
    return (
        <>
            <div className="flex flex-row items-center gap-4">
                <Heading as ='h3' className="mx-8">
                    Debit Note Details
                </Heading>
            </div>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <DebitNoteDetailsRow
                                    key={row.id}
                                    register={methods.register}
                                    removeRow={removeRow}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods}
                                    validationError={validationError?.details ?? {}}
                                />
                            ))}
                            <ShipmentSummaryRow methods={methods} />
                        </TableBody>
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