'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCourierForm } from "../../config/useCourierForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditCourierPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: courierData, isLoading } = api.courier.getCourierById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError } = useCourierForm(courierData);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    // TRPC utils
    const utils = api.useUtils();

    const updateCourier = api.courier.updateCourier.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Courier updated successfully!");
            await utils.courier.getCouriers.invalidate();
            await utils.courier.getCourierById.invalidate({ id });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {  
            id: parseInt(id),
            ...data,
        };
        try {
            await updateCourier.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating courier: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateCourier]);

    return (
        <Wrapper heading='Update Courier' >
            <Form 
                fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Update Courier" 
                register={methods.register}
                isLoading={isLoadingSubmit}
                validationError={validationError}
                error={error}
                disabled={!can_update || isLoading}
            />
        </Wrapper>
    );
};

export default EditCourierPage;