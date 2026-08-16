'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useEvPermission } from "../config/useEvPermission";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewEvPermissionPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useEvPermission();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addEvPermission = api.evPermissions.addEvPermission.useMutation({
        onSuccess: async () => {
            toast.success("EV Permission added successfully!");
            await Promise.all([
                utils.evPermissions.getAllEvPermissions.invalidate(),
                utils.evPermissions.getEvPermissions.invalidate(),
                utils.evPermissions.searchEvPermissions.invalidate()
            ]);
            setError(null);
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            await addEvPermission.mutateAsync({
                ...data,
                buyer_id: Number(data.buyer_id)
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding EV Permission: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addEvPermission, reset]);

    return (
        <Wrapper heading='Add Excess Value Permission' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Add New EV Permission"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewEvPermissionPage;