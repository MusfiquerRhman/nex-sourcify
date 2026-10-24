/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { DocumentSubmissionFormValues } from "../../config/formSchema";
import TableForm from "./FactoryInvoiceTableForm";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../../factoryInvoiceConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import { formatDate } from "~/utils/localDateString";
import { Portal, TableWrapper } from "~/components";
import { safeNumber } from "~/utils/numbers";

type props = {
    invoiceIndex: number;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: FieldErrors<DocumentSubmissionFormValues>;
    disabled?: boolean;
    selectedRdlInvoiceNo: string;
}

const FactoryInvoiceDetails = (props: props) => {
    const { invoiceIndex, methods, validationError, disabled = false, selectedRdlInvoiceNo } = props;

    const { 
        fields: shipmentFields, replace: replaceShipments
    } = useFieldArray<DocumentSubmissionFormValues>({
        control: methods.control,
        name: `rdlInvoices.${invoiceIndex}.factoryInvoices`,
    });

    const rdlInvoiceId = useWatch({
        control: methods.control,
        name: `rdlInvoices.${invoiceIndex}.rdl_invoice_id`
    });

    const { data: rdlInvoiceDetails } = api.documentSubmission.getRdlInvoiceDetails.useQuery(
        !!rdlInvoiceId ? { rdl_invoice_id: rdlInvoiceId } : skipToken
    );

    useEffect(() => {
        if (!rdlInvoiceDetails) return;
        
        const existingFactoryInvoice = methods.getValues(`rdlInvoices.${invoiceIndex}.factoryInvoices`) ?? [];

        replaceShipments(
            rdlInvoiceDetails.map((factoryInvoice) => {
                const factoryInvoiceId = factoryInvoice.factory_invoice_id?.toString();
                const existing = existingFactoryInvoice.find(
                    (x) => x.factory_invoice_id === factoryInvoiceId
                );

                return {
                    rdl_invoice_details_id: existing?.rdl_invoice_details_id ?? factoryInvoiceId ?? undefined,
                    factory_invoice_id: factoryInvoiceId ?? undefined,
                    factory_name: factoryInvoice.factory_name ?? undefined,
                    factory_invoice_no: factoryInvoice.factory_invoice_no ?? undefined,
                    factory_invoice_date: factoryInvoice.invoice_date 
                        ? formatDate(factoryInvoice.invoice_date) 
                        : undefined,
                    quantity: factoryInvoice.quantity.toString() ?? undefined,
                    factory_invoice_value: factoryInvoice.factory_invoice_value.toFixed(2) ?? undefined,
                    
                    // preserve existing values loaded from initialData
                    db_id: existing?.db_id,
                    factory_fdbc_no: existing?.factory_fdbc_no,
                    
                };
            })
        );
    }, [rdlInvoiceDetails, invoiceIndex]);

    const rdlInvoices = methods.watch("rdlInvoices") ?? [];

    const lastFactoryInvoiceIndex = rdlInvoices.reduce(
        (lastIndex, rdlInvoice, index) => rdlInvoice.rdl_invoice_id ? index : lastIndex,
        -1,
    );

    const grandTotalQuantity = rdlInvoices.reduce(
        (total, rdlInvoice) => total + (rdlInvoice.factoryInvoices ?? []).reduce(
            (invoiceTotal, factoryInvoice) => invoiceTotal + safeNumber(factoryInvoice.quantity),
            0,
        ),
        0,
    );
    
    const grandTotalValue = rdlInvoices.reduce(
        (total, rdlInvoice) => total + (rdlInvoice.factoryInvoices ?? []).reduce(
            (invoiceTotal, factoryInvoice) => invoiceTotal + safeNumber(factoryInvoice.factory_invoice_value),
            0,
        ),
        0,
    );

    return (
        <>
            <TableForm 
                selectedRdlInvoiceNo={selectedRdlInvoiceNo}
                name={`rdlInvoices.${invoiceIndex}.factoryInvoices`}
                rows={shipmentFields}
                columns={tableFormColumns}
                disabled={disabled}
                methods={methods}
                validationError={validationError}
                invoiceIndex={invoiceIndex}
            />
            {invoiceIndex === lastFactoryInvoiceIndex && (
                <Portal containerId="document_submissions_rdl_invoice_portal">
                    <div className="w-full px-8 pb-8">
                        <TableWrapper>
                            <colgroup>
                                <col span={6} style={{ width: "16.6667%" }} />
                            </colgroup>
                            <tfoot>
                                <tr className="font-bold text-sm">
                                    <td colSpan={4} className="border-r-2 border-gray/20 p-2 text-right">Factory Invoice Grand Total</td>
                                    <td className="bg-secondary text-white border-r-2 border-gray/20 p-2">{grandTotalQuantity} </td>
                                    <td className="bg-secondary text-white border-r-2 border-gray/20 p-2">{grandTotalValue.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </TableWrapper>
                    </div>
                </Portal>
            )}
        </>
    )
}

export default React.memo(FactoryInvoiceDetails) as typeof FactoryInvoiceDetails;