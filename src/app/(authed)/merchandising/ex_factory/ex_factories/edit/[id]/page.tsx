'use client';

import { Button, Form, MessageBox, Wrapper } from "~/components";
import React, { useCallback, useEffect, useState } from "react";
import { useExfactoryForm } from "../../config/useExfactoryForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDecodedUser, useModulePermissions } from "~/hooks";
import OrderDetails from "../../components/orderComponents/OrderDetails";
import type { shipment_modes } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { ParamsProp } from "~/types/params";

const EditExFactoryPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: exFactoryData, isLoading } = api.exFactory.getExFactoryById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useExfactoryForm(
        exFactoryData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { user } = useDecodedUser();

    const { can_update } = useModulePermissions();

    const updateExFactory = api.exFactory.updateExFactory.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Ex Factory updated successfully!");
            await Promise.all([
                utils.exFactory.getExFactories.invalidate(),
                utils.exFactory.getExFactoryById.invalidate({ id: id }),
                utils.exFactory.getShipmentsForExFactoryOrder.invalidate()
            ]);
        },
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (exFactoryData) => {
        try {
            setIsLoadingSubmit(true);

            const dbId = exFactoryData.exfactory.db_id;

            if (!dbId) {
                throw new Error("Missing Ex Factory ID.");
            }

            const payload = {
                db_id: dbId,
                exfactory_date: new Date(exFactoryData.exfactory.exfactory_date),
                remarks: exFactoryData.exfactory.remarks,
                orders: (exFactoryData.exfactory.orders ?? []).map((order) => ({
                    db_id: order.db_id,
                    shipments: (order.shipments ?? []).map((shipment) => ({
                        shipment_details_id: shipment.shipment_details_id!,
                        delivery_quantity: Number(shipment.shipment_quantity),
                        shipment_mode: shipment.shipment_mode! as shipment_modes,
                        po_close: shipment.po_close,
                    })),
                })),
            };
            
            await updateExFactory.mutateAsync(payload);
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error updating Ex Factory: ${parsedError}`);
            setError(parsedError);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [toast, parseTRPCError]);

    // Authorization
    const { data: authorizations, isLoading: isAuthorizationLoading } = api.exFactory.getAuthorizations.useQuery({ id });

    const isAuthorized = authorizations?.authorization?.is_authorized ?? false;

    const [canAuthorize, setCanAuthorize] = useState<boolean>(false);

    const setAuthorization = api.exFactory.approveExFactory.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Authorization status updated successfully!");
            await Promise.all([
                utils.exFactory.getAuthorizations.invalidate({ id }),
                utils.exFactory.getExFactories.invalidate(),
                utils.exFactory.searchExFactories.invalidate()
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

    useEffect(() => {
        if(validationError?.exfactory?.orders?.type === 'too_small') {
            toast.error("At least one order is required");
        }
    }, [validationError]);

    const { data: factoryInvoiceExists } = api.exFactory.checkFactoryInvoice.useQuery({ id: id })

    return (
        <Wrapper heading='Update Ex Factory'>
            <Form 
                name='exfactory'
                fields={formFields} 
                buttonLabel="Add New Buyer Order" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError.exfactory ?? {}}
                error={error}
                control={control}
                disabled={!can_update || isAuthorized || isLoadingSubmit}
            />
            <OrderDetails 
                methods={methods}
                validationError={validationError.exfactory ?? {}}
                disabled={isLoading || isAuthorized || isLoadingSubmit}
            />
            
            {/* Shipment Portal anchor */}
            <div id='shipment_details_portal'/> 

            <MessageBox 
                message="This Ex-Factory has been approved and cannot be updated or deleted." 
                active={isAuthorized} 
                type="secondary" 
            />

            <MessageBox
                message="Factory invoice exists for the shipments of this ex-factory."
                active={!!factoryInvoiceExists?.exists}
                type="info"
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Ex-Factory"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isAuthorized || isLoadingSubmit}
                />
            </div>

            <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                {isAuthorized ? (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="delete"
                            onClick={() => onSetAuthorization(false)}
                            label="Unauthorize Ex-Factory"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize }
                        />
                    </div>
                ) : (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => onSetAuthorization(true)}
                            label="Authorize Ex-Factory"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize}
                        />
                    </div>
                )}
            </div>
        </Wrapper>
    )
};

export default EditExFactoryPage;