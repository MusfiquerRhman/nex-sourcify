'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useFactoryInvoiceForm } from "../config/useFactoryInvoiceForm";
import { useRouter } from "next/navigation";
import ShipmentDetails from "../components/shipmentComponents/ShipmentDetails";
import Tags from "../components/tagItems/Tags";
import { safeNumber } from "~/utils/numbers";

const NewFactoryInvoicePage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFactoryInvoiceForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addFactoryInvoice = api.factoryInvoice.addFactoryInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Factory Invoice added successfully!");
            await Promise.all([
                utils.factoryInvoice.getFactoryInvoiceList.invalidate(),
                utils.exFactory.checkCommercialProcedure.invalidate()
            ]);
        }   
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (factoryInvoiceData) => {
        try {
            setIsLoading(true);
            const payload = {
                factory_id: safeNumber(factoryInvoiceData.factory_id),
                term_id: safeNumber(factoryInvoiceData.term_id),
                buyer_id: safeNumber(factoryInvoiceData.buyer_id),
                lc_sc_id: factoryInvoiceData.lc_sc_id,
                invoice_no: factoryInvoiceData.invoice_no.toLocaleUpperCase(),
                invoice_date: new Date(factoryInvoiceData.invoice_date ?? new Date()),
                remarks: factoryInvoiceData.remarks,
                discount: factoryInvoiceData.discount ? safeNumber(factoryInvoiceData.discount) : undefined,
                port_of_loading: factoryInvoiceData.port_of_loading ? safeNumber(factoryInvoiceData.port_of_loading) : undefined,
                freight_term_id: factoryInvoiceData.freight_term_id ? safeNumber(factoryInvoiceData.freight_term_id) : undefined,
                userConsigneeIds: factoryInvoiceData.consignee_ids ? factoryInvoiceData.consignee_ids.map(id => safeNumber(id)) : undefined,
                notifyPartyIds: factoryInvoiceData.notifyParties ? factoryInvoiceData.notifyParties.map(id => safeNumber(id)) : undefined,
                shipment_mode: factoryInvoiceData.shipment_mode,
                details: (factoryInvoiceData.details ?? []).map((detail) => ({
                    exfactory_shipment_id: detail.exfactory_shipment_id,
                })),
            };

            const res = await addFactoryInvoice.mutateAsync(payload);
            if (!res?.id) {
                throw new Error("No factory invoice ID returned");
            }
            router.push(`/commercial/factory_invoice/edit/${res.id}`);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Factory Invoice: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add Factory Invoice' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Factory Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <ShipmentDetails 
                methods={methods}
                disabled={isLoading}
            />

            <Tags 
                methods={methods}
                isLoading={isLoading}
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Factory Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewFactoryInvoicePage;