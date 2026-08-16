'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useColorsForm } from "../../config/useColorsForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditColorPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: colorData, isLoading } = api.colors.getColorById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError } = useColorsForm(colorData);
    
    // TRPC utils
    const utils = api.useUtils();

    const updateColor = api.colors.updateColors.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Color updated successfully!");
            await utils.colors.getColors.invalidate();
            await utils.colors.getColorById.invalidate({ id: parseInt(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {  
            id: parseInt(id),
            ...data,
        };

        try {
            await updateColor.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating color: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateColor]);

    return (
        <Wrapper heading="Update Color">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Color" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={!can_update}
            />
        </Wrapper>
    );
};

export default EditColorPage;