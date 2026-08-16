'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { useCommissionPercentageForm } from "../../config/useCommissionPercentageForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditCommissionPercentagePage = ({params}: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: commissionDistributionData, isLoading } = api.commissionPercentage.getCommissionById.useQuery(
        { id: Number(id) }
    );

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCommissionPercentageForm(
        commissionDistributionData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateCommissionDistribution = api.commissionPercentage.updateCommissions.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Commission Percentages updated successfully!");
            await Promise.all([
                utils.commissionPercentage.getCommissions.invalidate(),
                utils.commissionPercentage.getCommissionById.invalidate({ id: Number(id) })
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
                other_percentage: commissionDistributionData.other_percentage,
                overseas_percentage: commissionDistributionData.overseas_percentage
            }

            await updateCommissionDistribution.mutateAsync(payload);
         }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Commission Percentages: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    return (
        <Wrapper
            heading="Update Commission Percentages"
        >
            <Form
                fields={formFields} 
                buttonLabel="Update Commission Percentages"
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
                    label={"Update Commission Percentages"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || !can_update}
                />
            </div>
        </Wrapper>
    );
}

export default EditCommissionPercentagePage;