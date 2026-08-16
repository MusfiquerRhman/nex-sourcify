'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFabrics } from "../config/useFabrics";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewFabricPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useFabrics();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addFabric = api.fabrics.addFabric.useMutation({
        onSuccess: async () => {
            reset();
            setError(null);
            toast.success("Fabric added successfully!");
            await Promise.all([
                utils.fabrics.getFabrics.invalidate(),
                utils.fabrics.searchFabrics.invalidate()
            ]);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            product_type_id: Number(data.product_type_id),
            value: Number(data.value),
        };
        try {
            await addFabric.mutateAsync(payload);
        }
        catch(error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding fabric: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addFabric, reset]);

    return (
        <Wrapper heading='Add Fabric' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Fabric" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};
    
export default NewFabricPage;