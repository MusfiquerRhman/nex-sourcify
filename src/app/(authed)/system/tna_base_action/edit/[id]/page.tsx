'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";

import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useTnaBaseActionForm } from "../../config/useTnaBaseActionForm";
import { useModulePermissions } from "~/hooks";
import { formFields } from "../../config/formFields";
import type { ParamsProp } from "~/types/params";

const EditTnaBaseActionPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: tnaBaseActionData, isLoading } = api.tnaBaseAction.getTnaBaseActionById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, validationError, control } = useTnaBaseActionForm(tnaBaseActionData);

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateTnaBaseAction = api.tnaBaseAction.updateTnaBaseAction.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Base Action updated successfully!");
            await Promise.all([
                utils.tnaBaseAction.getAllTnaBaseActions.invalidate(),
                utils.tnaBaseAction.searchTnaBaseActions.invalidate(),
                utils.tnaBaseAction.getTnaBaseActionById.invalidate({ id }),
            ]);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            ...data,
            id: id,
            buyer_id: data.buyer_id,
            tna_action_id: data.action_id,
        };
        try {
            await updateTnaBaseAction.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating TNA Base Action: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateTnaBaseAction]);

    return (
        <Wrapper heading='Update TNA Base Action' >
            <Form fields={formFields(id)} 
                onSubmit={onSubmit}
                buttonLabel="Update TNA Base Action"
                register={methods.register}
                isLoading={isLoadingSubmit || isLoading}
                validationError={validationError}
                error={error}
                disabled={!can_update}
                control={control}
            />
        </Wrapper>
    );
};

export default EditTnaBaseActionPage;