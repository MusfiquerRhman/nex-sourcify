'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useTolerance } from "../../config/useTolerance";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditTolerancePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: toleranceData, isLoading } = api.toleranceLevel.getToleranceByID.useQuery({ id: Number(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTolerance(toleranceData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateTolerance = api.toleranceLevel.updateTolerance.useMutation({
        onSuccess: async () => {
            toast.success("Shipment Tolerance updated successfully!");
            setError(null);
            await Promise.all([
                utils.toleranceLevel.getTolerance.invalidate(),
                utils.toleranceLevel.searchTolerance.invalidate(),
                utils.toleranceLevel.getToleranceByID.invalidate({ id: Number(id) })
            ]);
        }
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        
        const payload = {   
            id: Number(id),
            buyer_id: Number(data.buyer_id),
            tolerance_level: data.tolerance_percentage
        };

        try {
            await updateTolerance.mutateAsync(payload);
        }
        catch (error) {            
            const message = parseTRPCError(error);
            toast.error(`Error updating shipment tolerance: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateTolerance]);

    return (    
        <Wrapper heading='Edit Shipment Tolerance' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Shipment Tolerance"
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

export default EditTolerancePage;