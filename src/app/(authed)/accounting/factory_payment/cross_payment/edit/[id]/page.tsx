'use client';

import { Button, Form, MessageBox, Wrapper } from "~/components";
import React, { useCallback, useEffect, useState } from "react";
import { useCrossPaymentForm } from "../../config/useCrossPaymentForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDecodedUser, useModulePermissions } from "~/hooks";
import FactoryInvoiceDetails from "../../components/FactoryInvoiceDetails";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

const EditCrossPaymentPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: crossPaymentData, isLoading } = api.crossPayments.getCrossPaymentById.useQuery({ cross_payment_id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCrossPaymentForm(
        crossPaymentData ?? undefined
    );

    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateCrossPayment = api.crossPayments.updateCrossPayment.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Cross Payment updated successfully!");
            await Promise.all([
                utils.crossPayments.getCrossPaymentById.invalidate({ cross_payment_id: id }),
                utils.crossPayments.getCrossPaymentList.invalidate(),
                utils.crossPayments.searchCrossPayments.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (crossPaymentData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                cross_payment_id: id,
                cross_payment_date: new Date(crossPaymentData.cross_payment_date),
                remarks: crossPaymentData.remarks,
                details: (crossPaymentData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    value: safeNumber(detail.value),
                    factory_invoice_id: detail.factory_invoice_id,
                    factory_payment_no: detail.factory_payment_no,
                    factory_payment_date: detail.factory_payment_date ? new Date(detail.factory_payment_date) : new Date(),
                })),
            };

            await updateCrossPayment.mutateAsync(payload);
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            setError(parsedError);
            toast.error(parsedError);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, updateCrossPayment]);

    const { user } = useDecodedUser();

    const { data: authorizations, isLoading: isAuthorizationLoading } = api.crossPayments.getAuthorizations.useQuery({ id });
    
    const isAuthorized = authorizations?.authorization?.is_authorized ?? false;

    const [canAuthorize, setCanAuthorize] = useState<boolean>(false);
    
    const setAuthorization = api.crossPayments.approveCrossPayment.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Authorization status updated successfully!");
            await Promise.all([
                utils.crossPayments.getAuthorizations.invalidate({ id }),
                utils.crossPayments.getCrossPaymentList.invalidate(),
                utils.crossPayments.searchCrossPayments.invalidate()
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

    return (
        <Wrapper heading='Update Cross Payment' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Cross Payment" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <FactoryInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading || !can_update || !!isAuthorized}
            />

            <MessageBox 
                message="This Cross payment has be authorized, it can't be updated / deleted" 
                active={!!isAuthorized} 
                type="error" 
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Cross Payment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || !can_update || isLoadingSubmit}
                />
            </div>

            <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                {isAuthorized ? (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="delete"
                            onClick={() => onSetAuthorization(false)}
                            label="Unauthorize Cross Payment"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize}
                        />
                    </div>
                ) : (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => onSetAuthorization(true)}
                            label="Authorize Cross Payment"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize}
                        />
                    </div>
                )}
            </div>
        </Wrapper>
    )
};

export default EditCrossPaymentPage;