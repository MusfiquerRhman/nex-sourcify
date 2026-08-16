'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";

import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useTnaForm } from "../../config/useTnaForm";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditTnaActionPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: tnaData, isLoading } = api.tnaActions.getTnaActionById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTnaForm(tnaData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateTnaAction = api.tnaActions.updateTnaAction.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Action updated successfully!");
            await utils.tnaActions.getTnaActions.invalidate();
            await utils.tnaActions.getTnaActionById.invalidate({ id: parseInt(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            ...data,
            id: parseInt(id),
            lead_time: Number(data.lead_time),
            alert_before: Number(data.alert_before),
            department_id: Number(data.department_id),
        };
        try {
            await updateTnaAction.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating TNA Action: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateTnaAction]);

    return (
        <Wrapper heading="Update TNA Action">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Overseas Office" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={!can_update}
                control={control}
            />
        </Wrapper>
    );
}

export default EditTnaActionPage;