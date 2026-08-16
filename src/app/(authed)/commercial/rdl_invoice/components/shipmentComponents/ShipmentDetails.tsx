/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { RDLInvoiceFormValues } from "../../config/formSchema";
import TableForm from "./ShipmentDetailsTableForm";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import React, { useEffect } from "react";
import { Heading } from "~/components";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../../shipmentConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";

type props = {
    invoiceIndex: number;
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: FieldErrors<RDLInvoiceFormValues>;
    disabled?: boolean;
    selectedFactoryInvoiceNo: string;
}

const ShipmentDetails = (props: props) => {
    const { invoiceIndex, methods, validationError, disabled = false, selectedFactoryInvoiceNo } = props;

    const { 
        fields: shipmentFields, replace: replaceShipments
    } = useFieldArray<RDLInvoiceFormValues>({
        control: methods.control,
        name: `details.${invoiceIndex}.factoryInvoiceDetails`,
    });

    const selectedFactoryInvoice = useWatch({
        control: methods.control,
        name: `details.${invoiceIndex}.factory_invoice_id`,
    });

    const rdlInvoiceDbId = useWatch({
        control: methods.control,
        name: `db_id`,
    });

    const shipmentDetails = api.rdlInvoice.getShipmentDetailsForFactoryInvoice.useQuery(
        !!selectedFactoryInvoice ? { factory_invoice_id: selectedFactoryInvoice, rdl_invoice_id: rdlInvoiceDbId } : skipToken
    );
    
    useEffect(() => {
        if (!shipmentDetails.data) return;

        const existingShipments = methods.getValues(`details.${invoiceIndex}.factoryInvoiceDetails`) ?? [];

        replaceShipments(
            shipmentDetails.data.map((shipmentDetail) => {
                const existing = existingShipments.find(
                    (x) => x.factory_invoice_details_id === shipmentDetail.id
                );

                return {
                    order_no: shipmentDetail.order_no ?? undefined,
                    style: shipmentDetail.styles ?? undefined,
                    po: shipmentDetail.po ?? undefined,
                    order_quantity: shipmentDetail.order_quantity ?? 0,
                    shipment_details_id: shipmentDetail.shipment_details_id,
                    destination_port: shipmentDetail.destination ?? undefined,
                    previous_quantity: shipmentDetail.previous_quantity ?? 0,
                    factory_invoice_details_id: shipmentDetail?.id,
                    invoice_fob: shipmentDetail.fob_rate?.toFixed(2) ?? undefined,
                    
                    // preserve existing values loaded from initialData
                    db_id: existing?.db_id,
                    invoice_quantity: existing?.invoice_quantity,
                    invoice_value: existing?.invoice_value,
                };
            })
        );
    }, [shipmentDetails.data, replaceShipments, methods, invoiceIndex]);

    const ShipmentHeading = () => (
        <div className="flex flex-row items-center gap-4">
            <Heading as ='h3' className="mx-8">
                {invoiceIndex + 1}. Factory Invoice Details of
                <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                    {selectedFactoryInvoiceNo}
                </span>
            </Heading>
        </div>
    );

    return (
        <TableForm 
            title={<ShipmentHeading />}
            name={`details.${invoiceIndex}.factoryInvoiceDetails`}
            rows={shipmentFields}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            invoiceIndex={invoiceIndex}
        />
    )
}

export default React.memo(ShipmentDetails) as typeof ShipmentDetails;