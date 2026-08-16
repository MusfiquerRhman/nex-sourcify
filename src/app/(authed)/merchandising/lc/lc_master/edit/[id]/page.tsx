'use client';

import { Button, Form, Info, MessageBox, Portal, Wrapper } from "~/components";
import React, { useCallback, useEffect, useState } from "react";
import { useLCForm } from "../../config/useLCForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useDecodedUser, useModulePath } from "~/hooks";
import OrderDetails from "../../components/orderComponents/orderDetails";
import ShipmentDetails from "../../components/shipmentComponents/ShipmentDetails";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { ParamsProp } from "~/types/params";

const EditLCMasterPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);
    
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: lcMasterData, isLoading } = api.lcMaster.getLCbyId.useQuery({ id });

    const { methods, handleSubmit, formFields, validationError, control } = useLCForm(lcMasterData);

     // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};
    
    const isApprovedOnce = lcMasterData?.approved_once ?? false;

    const updateLCMaster = api.lcMaster.updateLc.useMutation({
        onSuccess: async () => {
            setError(null);
            await Promise.all([
                utils.lcMaster.getLc.invalidate(),
                utils.lcMaster.getLCbyId.invalidate({ id }),
            ]);
            toast.success("LC Master updated successfully!");
        }
    });

    const onSubmitAll = useCallback(handleSubmit(async (lcMasterData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                lc_open_date: new Date(lcMasterData.lc_open_date ?? new Date()),
                lc_received_date: new Date(lcMasterData.lc_received_date ?? new Date()),
                lc_quantity: lcMasterData.lc_quantity,
                lc_value: lcMasterData.lc_value,
                currency_id: Number(lcMasterData.currency_id),
                rdl_bank_id: Number(lcMasterData.rdl_bank_id),
                company_id: Number(lcMasterData.company_id),
                buyer_bank_id: Number(lcMasterData.buyer_bank_id),
                latest_shipment_date: !!lcMasterData.latest_shipment_date 
                    ? new Date(lcMasterData.latest_shipment_date) 
                    : undefined,
                lc_expire_date: !!lcMasterData.expire_date 
                    ? new Date(lcMasterData.expire_date) 
                    : undefined,
                status: lcMasterData.lc_status,
                remarks: lcMasterData.remarks,
                orders: (lcMasterData.details ?? []).map((detail) => ({
                    order_id: detail.order_id,
                    dm_pi_no: detail.pi_no
                })),
            };

            await updateLCMaster.mutateAsync(payload);

        } catch (error) {
            setError("Failed to update LC Master.");
            toast.error(`Failed to update LC Master: ${parseTRPCError(error)}`);
        } finally {
            setIsLoadingSubmit(false);
        }
    }), [updateLCMaster, handleSubmit, id]);

    // Shipment details state
    const [orderIndex, setOrderIndex] = useState(-1);

    // Close shipment details view, -1 indicates no order selected
    const onCloseShipmentDetails = () => {
        setOrderIndex(-1);
    }

    const handleAction = (index: number) => {
        setOrderIndex(index);
    }

    // Authorization state and mutation
    const { data: authorizations, isLoading: isAuthorizationLoading } = api.lcMaster.getAuthorizations.useQuery({ id });

    const { user } = useDecodedUser();

    const isAuthorized = authorizations?.authorization?.is_authorized ?? false;

    const [canAuthorize, setCanAuthorize] = useState<boolean>(false);

    const setAuthorization = api.lcMaster.approveLcAuthorization.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Authorization status updated successfully!");
            await Promise.all([
                utils.lcMaster.getAuthorizations.invalidate({ id }),
                utils.lcMaster.getLc.invalidate(),
            ]);
        },
    });

    const onSetAuthorization = async (status: boolean) => {
        try {
            await setAuthorization.mutateAsync({
                id: id,
                is_authorized: status,
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
        <Wrapper
            heading="Update LC"
        >
            <Form 
                fields={formFields} 
                buttonLabel="Update LC" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update || isLoadingSubmit || isAuthorized || isApprovedOnce}
            />

            <OrderDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading || isAuthorized || isApprovedOnce}
                handleAction={handleAction}
            />

            <MessageBox 
                message="This LC has been approved and cannot be updated or deleted." 
                active={isAuthorized} 
                type="secondary" 
            />

            <MessageBox 
                message="This LC can't be modified directly, make amendments for changes." 
                active={isApprovedOnce} 
                type="warning" 
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update LC"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || !can_update || isAuthorized || isApprovedOnce}
                />
            </div>

            <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                {isAuthorized ? (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="delete"
                            onClick={() => onSetAuthorization(false)}
                            label="Unauthorize LC"
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
                            label="Authorize LC"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize}
                        />
                    </div>
                )}
            </div>


            {(orderIndex !== -1 && can_update) && (
                <Portal>
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={onCloseShipmentDetails}
                    >
                        <div className="bg-background rounded-lg py-1 w-[calc(100%-4rem)] h-auto max-h-[90vh] space-y-4 overflow-x-hidden overflow-y-scroll pr-2 custom-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ShipmentDetails 
                                methods={methods}
                                validationError={validationError ?? {}}
                                disabled={isLoading || isAuthorized || isApprovedOnce}
                                orderIndex={orderIndex} 
                                onCloseShipmentDetails={onCloseShipmentDetails}
                            />
                        </div>
                    </div>
                </Portal>
            )}
        </Wrapper>
    )
}

export default EditLCMasterPage;
