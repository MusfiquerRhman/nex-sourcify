'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCourierForm } from "../config/useCourierForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewCourierPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, reset } = useCourierForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addCourier = api.courier.addCourier.useMutation({
        onSuccess: async () => {
            toast.success("Courier added successfully!");
            await utils.courier.invalidate();
            setError(null);
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
        };
        try {
            await addCourier.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Courier: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addCourier, reset]);

    return (
        <Wrapper heading='Add Courier' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Courier" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
        </Wrapper>
    );
};

export default NewCourierPage;