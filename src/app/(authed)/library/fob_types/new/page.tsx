'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFobType } from "../config/useFobType";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewFobTypePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useFobType();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addFobType = api.fobTypes.addFobType.useMutation({
        onSuccess: async () => {
            toast.success("FOB Type added successfully!");
            await Promise.all([
                utils.fobTypes.getAll.invalidate(),
                utils.fobTypes.searchFobTypes.invalidate()
            ]);
            setError(null);
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            await addFobType.mutateAsync(data);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding FOB Type: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addFobType, reset]);

    return (
        <Wrapper heading='Add FOB Type' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Add New FOB Type"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewFobTypePage;