'use client';

import { Button, Form, MessageBox, Portal, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useLCAmendmentForm } from "../../config/useLCAmendmentForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import OrderDetails from "../../components/orderComponents/orderDetails";
import ShipmentDetails from "../../components/shipmentComponents/ShipmentDetails";
import type { ParamsProp } from "~/types/params";

const EditLCAmendmentPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: amendmentData, isLoading } = api.lcAmendment.getLcAmendmentById.useQuery({ id });

    const { methods, handleSubmit, formFields, validationError, control } = useLCAmendmentForm(amendmentData);

     // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const hasLatestAmendment = amendmentData?.has_latest_amendment ?? false;
    const isAuthorized = amendmentData?.is_authorized ?? false;
        
    const updateLCAmendment = api.lcAmendment.updateLcAmendment.useMutation({
        onSuccess: async () => {
            setError(null);
            await Promise.all([
                utils.lcAmendment.getLcAmendments.invalidate(),
                utils.lcAmendment.getLcAmendmentById.invalidate({ id }),
                utils.lcAmendment.searchLcAmendments.invalidate(),
                utils.buyerOrders.getBuyerOrders.invalidate(),
                utils.lcMaster.getOrdersForLc.invalidate(),
                utils.lcAmendment.getLcDetailsForAmendment.invalidate(),
            ]);
            toast.success("LC Amendment updated successfully!");
        }
    });

    const [orderIndex, setOrderIndex] = useState(-1);
    
    // Close shipment details view, -1 indicates no order selected
    const onCloseShipmentDetails = () => {
        setOrderIndex(-1);
    }

    const handleAction = (index: number) => {
        setOrderIndex(index);
    }

    const onSubmitAll = useCallback(handleSubmit(async (amendmentData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                amend_quantity: amendmentData.lc_quantity,
                amend_value: amendmentData.lc_value,
                remarks: amendmentData.remarks,
                orders: (amendmentData.details ?? []).map((detail) => ({
                    id: detail.db_id,
                    order_id: detail.order_id,
                    pi_no: detail.pi_no,
                })),
            };

            await updateLCAmendment.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update LC Amendment: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [updateLCAmendment, handleSubmit]);

    return (
        <Wrapper
            heading="Update LC Amendment"
        >
            <Form 
                fields={formFields} 
                buttonLabel="Update LC Amendment" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update || isLoadingSubmit || hasLatestAmendment || isAuthorized}
            />

            <OrderDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading}
                handleAction={handleAction}
            />
                
            <MessageBox 
                message="This LC has more recent amendments, this amendment cannot be updated / deleted." 
                active={hasLatestAmendment} 
                type="info" 
            />

            <MessageBox 
                message="This LC is authorized and cannot be updated / deleted." 
                active={isAuthorized} 
                type="secondary" 
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update LC Amendment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || !can_update || hasLatestAmendment || isAuthorized}
                />
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
                                disabled={isLoading || !can_update || hasLatestAmendment || isAuthorized}
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

export default EditLCAmendmentPage;