'use client';

import { Button, Form, Info, MessageBox, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useDecodedUser, useModulePath } from "~/hooks";
import StylesDetails from "../../components/styleComponents/styles";
import { printingWhiteIcon } from "~/assets";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";

const EditFactoryOrderPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: factoryOrderData, isLoading } = api.factoryOrder.getFactoryOrderById.useQuery(
        { factoryOrderId: id }
    );

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFactoryOrderForm(
        factoryOrderData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update, can_view } = permissions ?? {};

    const {data: isCommissionDistributionAuthorized} = api.factoryOrder.isCommissionDistributionAuthorized.useQuery(
        { factoryOrderId: id },
        { enabled: !!id }
    );

    const updateFactoryOrder = api.factoryOrder.updateFactoryOrder.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Factory Order updated successfully!");
            await utils.factoryOrder.getFactoryOrders.invalidate();
            // utils.factoryOrder.getFactoryOrderById.invalidate({ factoryOrderId: id });
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (factoryOrderData) => {
        try {
            setIsLoadingSubmit(true);

            await updateFactoryOrder.mutateAsync({
                factoryOrderId: id,
                order_id: factoryOrderData.factoryOrder.order_id,
                factory_order_date: factoryOrderData.factoryOrder.factory_order_date,
                currency_id: Number(factoryOrderData.factoryOrder.currency_id),
                currency_rate: Number(factoryOrderData.factoryOrder.currency_rate),
                remarks: factoryOrderData.factoryOrder.remarks,
                shipments: (factoryOrderData.factoryOrder?.styles ?? []).flatMap(style => 
                    (style?.shipments ?? []).map(shipment => ({
                        factory_shipment_id: shipment?.db_id,
                        shipment_id: shipment?.shipment_id ?? '',
                        exfactory_date: shipment?.exfactory_date,
                        factory_fob: shipment?.factory_fob,
                        transfer_rate: shipment?.transfer_rate,
                    }))
                ),
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Factory Order: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    const [canAuthorize, setCanAuthorize] = useState(false);

    const { user, isAdmin } = useDecodedUser();
    const { data: authorizations, isLoading: isAuthorizationLoading } = api.factoryOrder.getAuthorizations.useQuery(
        { factoryOrderId: id }
    );

    const isFirstLevelAuthorized = authorizations?.authorizations?.approval_status === 1;
    const isAuthorized = authorizations?.authorizations?.approval_status === 2;
    const approvalLevel = authorizations?.authorizationPermission?.approval_level ?? 0;

    useEffect(() => {
        setCanAuthorize(
            !(
                isAuthorizationLoading 
                || !authorizations?.authorizations?.is_complete 
                || (
                    !(
                        user?.department_id === authorizations?.authorizationPermission?.department_id 
                        && user?.level_id === authorizations?.authorizationPermission?.level_id
                    )
                )
            )
        )
    }, [isAuthorizationLoading, authorizations, user]);

    const setAuthorization = api.factoryOrder.approveFactoryOrder.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Authorization status updated successfully!");
            await Promise.all([
                utils.factoryOrder.getFactoryOrders.invalidate(),
                utils.factoryOrder.searchFactoryOrders.invalidate(),
                utils.factoryOrder.getAuthorizations.invalidate({ factoryOrderId: id }),
            ])
        },
    });


    const hasPermission = api.evPermissions.getEvPermissions.useQuery(
        !!id ? { factoryOrderID: id } : skipToken,
    );


    const onSetAuthorization = async (status: number) => {
        try {
            await setAuthorization.mutateAsync({
                factoryOrderId: id,
                approval_status: status,
                previous_approval_status: authorizations?.authorizations?.approval_status ?? 0,
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating authorization status: ${message}`);
            setError(message);
        }
    };

    return (
        <Wrapper heading='Update Factory Order'
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/factory_order/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }        
        >
            <Form 
                name='factoryOrder'
                fields={formFields} 
                buttonLabel="Update Factory Order" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError.factoryOrder ?? {}}
                error={error}
                control={control}
                disabled={!can_update || authorizations?.authorizations?.approval_status === 2}
            />

            <StylesDetails 
                methods={methods}
                validationError={validationError.factoryOrder ?? {}}
                disabled={!can_update || authorizations?.authorizations?.approval_status === 2}
            />

            {/* Shipment Portal anchor */}
            <div id='shipment_details_portal'/>

            <MessageBox 
                message="This Factory Order is First Level Authorized, and ready for final authorization." 
                active={authorizations?.authorizations?.approval_status === 1} 
                type="primary" 
            />

            <MessageBox 
                message="Factory order has been approved, and cannot be updated or deleted." 
                active={authorizations?.authorizations?.approval_status === 2} 
                type="secondary" 
            />

            <MessageBox 
                message="Factory order / Buyer order is incomplete." 
                active={!authorizations?.authorizations?.is_complete} 
                type="error" 
            />

            <MessageBox 
                message="Commission distribution for this order has been authorized. Factory order can't be authorized or unauthorized." 
                active={!!isCommissionDistributionAuthorized} 
                type="warning" 
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Factory Order"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={
                        isLoading 
                        || isLoadingSubmit 
                        || !can_update 
                        || !hasPermission.data
                        && (
                            authorizations?.authorizations?.approval_status === 2 
                            || (isCommissionDistributionAuthorized ?? false)
                        )
                    }
                />
            </div>

            <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                {isAuthorized ? (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="delete"
                            onClick={() => onSetAuthorization(0)}
                            label="Authorized, Click to Unauthorize"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={((isAdmin || (canAuthorize && approvalLevel === 2)) ? false : true) 
                                                || (isCommissionDistributionAuthorized ?? false)}
                        />
                    </div>
                ) : (
                    isFirstLevelAuthorized ? (
                        <>
                            {((canAuthorize && approvalLevel === 2) || isAdmin) && (
                                <div className="flex flex-row justify-start">
                                    <Button 
                                        type="button"
                                        variant="secondary"
                                        onClick={() => onSetAuthorization(2)}
                                        label="Authorize This Factory Order"
                                        className="text-lg tracking-wide mt-6 max-w-80"
                                        disabled={((isAdmin || (canAuthorize && approvalLevel === 2)) && isFirstLevelAuthorized ? false : true) 
                                                            || (isCommissionDistributionAuthorized ?? false)
                                                            || !authorizations?.authorizations?.is_complete
                                                }
                                    />
                                </div> 
                            )}

                            {((canAuthorize && approvalLevel === 1) || isAdmin) && (
                                <div className="flex flex-row justify-start">
                                    <Button 
                                        type="button"
                                        variant="delete"
                                        onClick={() => onSetAuthorization(0)}
                                        label="Unauthorize 1st Level Authorization"
                                        className="text-lg tracking-wide mt-6 max-w-80"
                                        disabled={((isAdmin || (canAuthorize && approvalLevel === 1)) && isFirstLevelAuthorized ? false : true) 
                                                            || (isCommissionDistributionAuthorized ?? false)}
                                    />
                                </div> 
                            )}
                        </>
                    ) : (
                        <div className="flex flex-row justify-start">
                            <Button 
                                type="button"
                                variant="secondary"
                                onClick={() => onSetAuthorization(1)}
                                label="Authorize First level"
                                className="text-lg tracking-wide mt-6 max-w-80"
                                disabled={((isAdmin || (canAuthorize && approvalLevel === 1)) && !isFirstLevelAuthorized ? false : true) 
                                                    || (isCommissionDistributionAuthorized ?? false)
                                                    || !authorizations?.authorizations?.is_complete
                                        }
                            />
                        </div>
                    )
                )}
            </div>
        </Wrapper>
    )
};

export default EditFactoryOrderPage;