'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useRDLInvoiceForm } from "../config/useRDLInvoiceForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";
import FactoryInvoiceDetails from "../components/factoryInvoiceComponents/FactoryInvoiceDetails";

const NewRDLInvoicePage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useRDLInvoiceForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addRDLInvoice = api.rdlInvoice.addRdlInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Invoice added successfully!");
            await Promise.all([
                utils.rdlInvoice.getRdlInvoice.invalidate(),
                utils.rdlInvoice.searchRdlInvoices.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (rdlInvoiceData) => {
        try {
            setIsLoading(true);
            const payload = {
                buyer_id: safeNumber(rdlInvoiceData.buyer_id),
                term_id: safeNumber(rdlInvoiceData.term_id),
                lc_sc_id: rdlInvoiceData.lc_sc_id,
                invoice_no: rdlInvoiceData.invoice_no,
                invoice_date: new Date(rdlInvoiceData.invoice_date ?? new Date()),
                invoice_type: rdlInvoiceData.invoice_type,
                pi_no: rdlInvoiceData.pi_no,
                remarks: rdlInvoiceData.remarks,
                container_no: rdlInvoiceData.container_no,
                discount: rdlInvoiceData.discount ? safeNumber(rdlInvoiceData.discount) : undefined,
                details: (rdlInvoiceData.details ?? []).map((detail) => ({
                    factory_id: safeNumber(detail.factory_id),
                    factory_invoice_id: detail.factory_invoice_id ?? "",
                    shipments: detail.factoryInvoiceDetails?.map((shipment) => ({
                        shipment_details_id: shipment.shipment_details_id ?? "",
                        invoice_quantity: safeNumber(shipment.invoice_quantity),
                        factory_invoice_details_id: shipment.factory_invoice_details_id ?? "",
                    })) ?? [],
                })),
            };

            const res = await addRDLInvoice.mutateAsync(payload);

            if (!res?.id) {
                throw new Error("missing response id.");
            }

            router.push(`/commercial/rdl_invoice/edit/${res.id}`);
        }   
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Invoice: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });



    return (
        <Wrapper heading='Add Invoice' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <FactoryInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading}
            />

            {/* Shipment Portal anchor */}
            <div id='rdl_invoice_shipment_details_portal'/> 

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    )
}

export default NewRDLInvoicePage;