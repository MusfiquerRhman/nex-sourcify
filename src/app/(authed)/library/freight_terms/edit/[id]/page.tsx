'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFreightTerm } from "../../config/useFreightTerm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditFreightTermPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: freightTermData, isLoading } = api.freightTerms.getFreightTermById.useQuery({ id: Number(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useFreightTerm(freightTermData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateFreightTerm = api.freightTerms.updateFreightTerm.useMutation({
        onSuccess: async () => {
            toast.success("Freight Term updated successfully!");
            setError(null);
            reset();
            await Promise.all([
                utils.freightTerms.getFreightTermById.invalidate({ id: Number(id) }),
                utils.freightTerms.getFreightTerms.invalidate(),
                utils.freightTerms.searchFreightTerms.invalidate()
            ]);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {   
            id: Number(id),
            ...data,
        };
        try {
            await updateFreightTerm.mutateAsync(payload);
        }
        catch (error) {            
            const message = parseTRPCError(error);
            toast.error(`Error updating Freight Term: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }),  [handleSubmit, id, updateFreightTerm]);

    return (    
        <Wrapper heading='Update Freight Term' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Freight Term"
                register={methods.register}
                isLoading={isLoadingSubmit}
                validationError={validationError}
                error={error}
                control={control}
                disabled={!can_update || isLoading}
            />
        </Wrapper>
    );
}

export default EditFreightTermPage;