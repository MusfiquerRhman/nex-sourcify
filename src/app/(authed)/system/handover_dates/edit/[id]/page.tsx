'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useHandoverDatesForm } from "../../config/useHandoverDatesForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditHandoverDatesPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: handoverDateData, isLoading } = api.handoverDates.getHandoverDateById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useHandoverDatesForm(handoverDateData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateHandoverDate = api.handoverDates.updateHandoverDate.useMutation({
        onSuccess: async () => {
            toast.success("Handover Date updated successfully!");
            setError(null);
            await utils.handoverDates.getHandoverDates.invalidate();
            await utils.handoverDates.getHandoverDateById.invalidate({ id: parseInt(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {  
            id: parseInt(id),
            ...data,
        };

        try {
            await updateHandoverDate.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating handover date: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateHandoverDate]);

    return (
        <Wrapper heading="Update Handover Date">
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

export default EditHandoverDatesPage;