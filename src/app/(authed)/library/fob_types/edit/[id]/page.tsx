'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFobType } from "../../config/useFobType";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditFobTypePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: fobTypeData, isLoading } = api.fobTypes.getFobTypeById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFobType(fobTypeData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateFobType = api.fobTypes.updateFobType.useMutation({
        onSuccess: async () => {
            toast.success("FOB Type updated successfully!");
            setError(null);
            await Promise.all([
                utils.fobTypes.getAll.invalidate(),
                utils.fobTypes.searchFobTypes.invalidate(),
                utils.fobTypes.getFobTypeById.invalidate({ id })
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
            await updateFobType.mutateAsync(payload);
        }

        catch (error) {            
            const message = parseTRPCError(error);
            toast.error(`Error updating FOB Type: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateFobType]);

    return (
        <Wrapper heading='Update FOB Type' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update FOB Type"
                register={methods.register}
                isLoading={isLoadingSubmit || isLoading}
                validationError={validationError}
                error={error}
                disabled={!can_update}
                control={control}
            />
        </Wrapper>
    );
}

export default EditFobTypePage;