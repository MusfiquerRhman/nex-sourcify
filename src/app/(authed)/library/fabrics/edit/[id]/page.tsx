'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFabrics } from "../../config/useFabrics";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditFabricPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: fabricData, isLoading } = api.fabrics.getFabricById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFabrics(fabricData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateFabric = api.fabrics.updateFabric.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Fabric updated successfully!");
            await utils.fabrics.getFabrics.invalidate();
            await utils.fabrics.getFabricById.invalidate({ id });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {   
            id: Number(id),
            ...data,
            product_type_id: Number(data.product_type_id),
            value: Number(data.value),
        };

        try {
            await updateFabric.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating fabric: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateFabric]);

    return (
        <Wrapper heading="Update Fabric">
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Fabric"
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

export default EditFabricPage;