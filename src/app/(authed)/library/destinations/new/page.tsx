'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useDestinationsForm } from "../config/useDestinationsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewDestinationPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useDestinationsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addDestination = api.destinations.addDestination.useMutation({
        onSuccess: async () => {
            toast.success("Destination added successfully!");
            await utils.destinations.invalidate();
            setError(null);
            reset();
        },
        onError: (error: { message: React.SetStateAction<string | null>; }) => {
            const message = parseTRPCError(error);
            toast.error(`Failed to add destination: ${message}`);
            setError(message);
            setIsLoading(false);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            country_id: data.country_id ? Number(data.country_id) : undefined,
        };
        await addDestination.mutateAsync(payload);
        setIsLoading(false);
    }), [handleSubmit, addDestination, reset]);

    return (
        <Wrapper heading='Add Destination' >   
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Destination"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewDestinationPage;