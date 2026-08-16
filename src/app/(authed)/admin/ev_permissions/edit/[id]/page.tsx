'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useEvPermission } from "../../config/useEvPermission";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditEvPermissionPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);
    
        const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

        const { data: evPermissionData, isLoading } = api.evPermissions.getEvPermissionById.useQuery({ id: Number(id) });
        // Form setup
        const { methods, handleSubmit, formFields, validationError, control } = useEvPermission(evPermissionData);

        // TRPC utils
        const utils = api.useUtils();

        // Get current module path
        const modulePath = useModulePath().path;

        // Get current module permissions
        const pathId = useNavigationStore((s) => s.getByHref(modulePath));
        const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
        const { can_update } = permissions ?? {};

        const updateEvPermission = api.evPermissions.updateEvPermission.useMutation({
            onSuccess: async () => {
                toast.success("EV Permission updated successfully!");
                setError(null);
                await Promise.all([
                    utils.evPermissions.getAllEvPermissions.invalidate(),
                    utils.evPermissions.searchEvPermissions.invalidate(),
                    utils.evPermissions.getEvPermissionById.invalidate({ id: Number(id) })
                ]);
            }
        });

        const onSubmit = useCallback(handleSubmit(async (data) => {
            setIsLoadingSubmit(true);
            const payload = {   
                id: Number(id),
                ...data,
                buyer_id: Number(data.buyer_id)
            };
            try {
                await updateEvPermission.mutateAsync(payload);
            }
            catch (error) {            
                const message = parseTRPCError(error);
                toast.error(`Error updating EV Permission: ${message}`);
                setError(message);
            }
            finally {
                setIsLoadingSubmit(false);
            }
        }), [handleSubmit, id, updateEvPermission]);

    return (
        <Wrapper heading='Edit Excess Value Permission' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update EV Permission"
                register={methods.register}
                isLoading={isLoadingSubmit || isLoading}
                validationError={validationError}
                error={error}
                control={control}
                disabled={!can_update}
            />
        </Wrapper>
    );
}

export default EditEvPermissionPage;