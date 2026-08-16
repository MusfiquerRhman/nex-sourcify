'use client';

import { Button, Form, MessageBox, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import { useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import ShipmentDetails from "../../components/shipmentComponents/ShipmentDetails";
import Tags from "../../components/tagItems/Tags";
import { safeNumber } from "~/utils/numbers";
import { printingWhiteIcon } from "~/assets";
import { useWatch } from "react-hook-form";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";

const EditFactoryInvoicePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: factoryInvoiceData, isLoading } = api.factoryInvoice.getFactoryInvoiceById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFactoryInvoiceForm(
        factoryInvoiceData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update, can_view } = useModulePermissions();

    const updateFactoryInvoice = api.factoryInvoice.updateFactoryInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Factory Invoice updated successfully!");
            await Promise.all([
                utils.factoryInvoice.getFactoryInvoiceById.invalidate({ id }),
                utils.factoryInvoice.getFactoryInvoiceList.invalidate(),
                utils.factoryInvoice.getShipmentDetailsForTagShipments.invalidate(),
                utils.exFactory.checkCommercialProcedure.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (factoryInvoiceData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: factoryInvoiceData.db_id ?? id,
                discount: factoryInvoiceData.discount ? safeNumber(factoryInvoiceData.discount) : undefined,
                remarks: factoryInvoiceData.remarks,
                shipment_mode: factoryInvoiceData.shipment_mode,
                details: (factoryInvoiceData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    exfactory_shipment_id: detail.exfactory_shipment_id,
                })),
            };

            await updateFactoryInvoice.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Factory Invoice: ${message}`);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [id, updateFactoryInvoice, handleSubmit]);

    const db_id = useWatch({ control, name: "db_id" });

    const { data: rdlInvoiceExistsData } = api.factoryInvoice.checkIfRdlInvoiceExists.useQuery(
        !!db_id ? { factory_invoice_id: db_id ?? "" } : skipToken,
    );

    const exists = !!rdlInvoiceExistsData?.exists;

    return (
        <Wrapper heading='Update Factory Invoice'
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/factory_invoice/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <Form 
                fields={formFields} 
                buttonLabel="Update Factory Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update || exists}
            />

            <ShipmentDetails 
                methods={methods}
                disabled={isLoading || exists}
            />
            
            <Tags 
                methods={methods}
                isLoading={isLoading}
                disabled={isLoading || exists}
            />

            <MessageBox 
                message="This Factory Invoice has associated Invoice and cannot be updated or deleted." 
                active={exists} 
                type="primary" 
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Factory Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit|| exists}
                />
            </div>
        </Wrapper>
    )
};

export default EditFactoryInvoicePage;