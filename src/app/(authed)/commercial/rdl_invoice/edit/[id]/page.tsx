'use client';

import { Button, Form, Wrapper, MessageBox } from "~/components";
import React, { useCallback, useEffect, useState } from "react";
import { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDecodedUser, useModulePermissions, } from "~/hooks";
import FactoryInvoiceDetails from "../../components/factoryInvoiceComponents/FactoryInvoiceDetails";
import { printingWhiteIcon } from "~/assets";
import { safeNumber } from "~/utils/numbers";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { useWatch } from "react-hook-form";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";

const EditRDLInvoicePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: rdlInvoiceData, isLoading } = api.rdlInvoice.getRdlInvoiceById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useRDLInvoiceForm(
        rdlInvoiceData ?? undefined
    );

    const { data: authorizations, isLoading: isAuthorizationLoading } = api.rdlInvoice.getAuthorizations.useQuery({ id });
    const isAuthorized = authorizations?.authorization?.is_authorized ?? false;

    const { user } = useDecodedUser();

    // TRPC utils
    const utils = api.useUtils();

    const { can_update, can_view } = useModulePermissions();

    const updateRDLInvoice = api.rdlInvoice.updateRdlInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Invoice updated successfully!");
            await Promise.all([
                utils.rdlInvoice.getRdlInvoiceById.invalidate({ id }),
                utils.rdlInvoice.getRdlInvoice.invalidate(),
            ]);
        }

    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (rdlInvoiceData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                invoice_date: new Date(rdlInvoiceData.invoice_date ?? new Date()),
                pi_no: rdlInvoiceData.pi_no,
                remarks: rdlInvoiceData.remarks,
                container_no: rdlInvoiceData.container_no,
                discount: rdlInvoiceData.discount,
                details: (rdlInvoiceData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    factory_id: safeNumber(detail.factory_id),
                    factory_invoice_id: detail.factory_invoice_id ?? "",
                    shipments: detail.factoryInvoiceDetails?.map((shipment) => ({
                        db_id: shipment.db_id,
                        shipment_details_id: shipment.shipment_details_id ?? "",
                        invoice_quantity: safeNumber(shipment.invoice_quantity),
                        factory_invoice_details_id: shipment.factory_invoice_details_id ?? "",
                    })) ?? [],
                })),
            };

            await updateRDLInvoice.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Invoice: ${message}`);
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    }), [updateRDLInvoice]);

    const [canAuthorize, setCanAuthorize] = useState<boolean>(false);

    const setAuthorization = api.rdlInvoice.approveRDLInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Authorization status updated successfully!");
            await Promise.all([
                utils.rdlInvoice.getAuthorizations.invalidate({ id }),
                utils.rdlInvoice.getRdlInvoice.invalidate(),
                utils.rdlInvoice.searchRdlInvoices.invalidate()
            ]);
        },
    });

    const onSetAuthorization = async (status: boolean) => {
        try {
            await setAuthorization.mutateAsync({
                id: id,
                approval_status: status,
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating authorization status: ${message}`);
            setError(message);
        }
    };

    useEffect(() => {
        setCanAuthorize(
            !(
                isAuthorizationLoading 
                || (
                    !(
                        user?.department_id === authorizations?.permission?.department_id 
                        && user?.level_id === authorizations?.permission?.level_id
                    ) && 
                    !(
                        Number(user?.department_id) === ADMIN_DEPARTMENT_ID
                        && Number(user?.level_id) === ADMIN_LEVEL_ID
                    )
                )
            )
        );
    }, [isAuthorizationLoading, authorizations, user]);
    
    const db_id = useWatch({ control, name: "db_id" });
    
    const { data: documentSubmissionExistsData } = api.rdlInvoice.checkIfDocumentSubmissionExists.useQuery(
        !!db_id ? { rdl_invoice_id: db_id ?? "" } : skipToken,
    );

    const exists = !!documentSubmissionExistsData?.exists;
    
    return (
        <Wrapper heading='Update Invoice' 
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/rdl_invoice/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update || isAuthorized || exists}
            />

            <FactoryInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading || isAuthorized || exists}
            />

            {/* Shipment Portal anchor */}
            <div id='rdl_invoice_shipment_details_portal'/> 
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || isAuthorized || exists}
                />
            </div>

            <MessageBox 
                message="This Invoice has been approved and cannot be updated or deleted" 
                active={isAuthorized} 
                type="secondary" 
            />

            <MessageBox 
                message="This Invoice has associated Document Submission and cannot be updated or deleted" 
                active={exists} 
                type="primary" 
            />

            <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                {isAuthorized ? (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="delete"
                            onClick={() => onSetAuthorization(false)}
                            label="Unauthorize Invoice"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize || exists}
                        />
                    </div>
                ) : (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => onSetAuthorization(true)}
                            label="Authorize Invoice"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize}
                        />
                    </div>
                )}
            </div>
        </Wrapper>
    )
};

export default EditRDLInvoicePage;
