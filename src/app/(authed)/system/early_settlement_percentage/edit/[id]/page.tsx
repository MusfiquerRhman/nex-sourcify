'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { useEarlySettlementPercentageForm } from "../../config/useEarlySettlementPercentageForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditEarlySettlementPercentagePage = ({params}: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: earlySettlementData, isLoading } = api.earlySettlementPercentage.getEarlySettlementPercentageById.useQuery(
        { id: id }
    );

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useEarlySettlementPercentageForm(
        earlySettlementData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateCommissionDistribution = api.earlySettlementPercentage.updateEarlySettlementPercentage.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Early Settlement Percentages updated successfully!");
            await Promise.all([
                utils.earlySettlementPercentage.getEarlySettlementPercentage.invalidate(),
                utils.earlySettlementPercentage.getEarlySettlementPercentageById.invalidate({ id: id })
            ])
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (commissionDistributionData) => {
        try {
            setIsLoadingSubmit(true);

            if (!commissionDistributionData.db_id) {
                throw new Error("db_id is required");
            }

            const payload = {
                db_id: commissionDistributionData.db_id,
                charge: commissionDistributionData.charge,
            }

            await updateCommissionDistribution.mutateAsync(payload);
         }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Early Settlement Percentages: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    return (
        <Wrapper
            heading="Update Early Settlement Percentages"
        >
            <Form
                fields={formFields} 
                buttonLabel="Update Early Settlement"
                register={methods.register}
                isLoading={isLoading || isLoadingSubmit}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Early Settlement"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || !can_update}
                />
            </div>
        </Wrapper>
    );
}

export default EditEarlySettlementPercentagePage;