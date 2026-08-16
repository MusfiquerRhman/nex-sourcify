'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useDestinationsForm } from "../../config/useDestinationsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditDestinationPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { data: destinationData, isLoading } = api.destinations.getDestinationById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useDestinationsForm(destinationData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateDestination = api.destinations.updateDestination.useMutation({
        onSuccess: async () => {
            toast.success("Destination updated successfully!");
            await utils.destinations.invalidate();
            await utils.destinations.getDestinationById.invalidate({ id });
            setError(null);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            id: parseInt(id),
            ...data,
            country_id: data.country_id ? Number(data.country_id) : undefined,
        };

        try {
            await updateDestination.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update destination: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }

    }), [handleSubmit, id, updateDestination]);
    
    return (
        <Wrapper heading="Update Destination">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Destinations" 
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

export default EditDestinationPage;