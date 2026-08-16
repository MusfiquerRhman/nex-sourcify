'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import { useTnaPlanningForm } from "../../config/useTnaPlanningForm";
import ActionDetails from "../../components/actionDetails";
import type { ParamsProp } from "~/types/params";

const EditTnaPlanningPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: tnaData, isLoading } = api.tnaPlan.getTnaPlanById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTnaPlanningForm( tnaData ?? undefined );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateTNAPlan = api.tnaPlan.updateTnaPlan.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Plan updated successfully!");
            await utils.tnaPlan.getTnaPlans.invalidate();
            await utils.tnaPlan.getTnaPlanById.invalidate({ id: id });
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (tnaPlanData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = tnaPlanData.actions
                ?.filter((action): action is typeof tnaPlanData.actions[number] & { db_id: string;} => !!(action.db_id))
                .map(action => ({
                    id: action.db_id,
                    revise_date: action.revise_date ? new Date(action.revise_date) : undefined,
                    actual_date: action.actual_date ? new Date(action.actual_date) : undefined,
                })) ?? [];

            await updateTNAPlan.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating TNA Plan: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    return (    
        <Wrapper
            heading="Update TNA Plan"
        >
            <Form
                fields={formFields} 
                buttonLabel="Update TNA Plan"
                register={methods.register}
                isLoading={isLoading || isLoadingSubmit}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <ActionDetails
                methods={methods}
                validationError={validationError.actions ?? {}}
                disabled={!can_update}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update TNA Plan"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    );
}

export default EditTnaPlanningPage;