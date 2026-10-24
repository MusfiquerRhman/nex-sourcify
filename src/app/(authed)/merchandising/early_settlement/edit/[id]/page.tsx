'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import { useEarlySettlementForm } from "../../config/useEarlySettlementForm";
import ShipmentDetails from "../../components/shipmentDetails";
import type { ParamsProp } from "~/types/params";

const EditEarlySettlementPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: earlySettlement, isLoading } = api.earlySettlement.getEarlySettlementById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useEarlySettlementForm(
        earlySettlement ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateProceedRealization = api.earlySettlement.updateEarlySettlement.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Early Settlement updated successfully!");
            await Promise.all([
                utils.earlySettlement.getEarlySettlementById.invalidate({ id }),
                utils.earlySettlement.getEarlySettlements.invalidate(),
                utils.earlySettlement.searchEarlySettlements.invalidate(),
                utils.earlySettlement.getPoDetails.invalidate(),
                utils.earlySettlement.getOrderForEarlySettlement.invalidate(),
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (settlements) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id: settlements.db_id ?? "",
                remarks: settlements.remarks,
                pos: (settlements.pos ?? []).map((po) => ({
                    id: po.db_id ?? "",
                    percentage: po.early_settlement_charge ?? 0,
                })),
            };

            await updateProceedRealization.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Early Settlement: ${message}`);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, updateProceedRealization]);


    return (
        <Wrapper heading='Update Early Settlement'>
            <Form 
                fields={formFields} 
                buttonLabel="Update Early Settlement" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <ShipmentDetails 
                methods={methods}
                validationError={validationError}
                disabled={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Early Settlement"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditEarlySettlementPage;