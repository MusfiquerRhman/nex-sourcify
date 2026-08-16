'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useColorsForm } from "../config/useColorsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewColorPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, reset } = useColorsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addColor = api.colors.addColors.useMutation({
        onSuccess: async () => {
            setError(null);
            reset();
            toast.success("Color added successfully!");
            await utils.colors.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
        };
        try {
            await addColor.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Color: ${message}`);
            setError(message);
        }
        finally{ 
            setIsLoading(false);
        }
    }), [handleSubmit, addColor, reset]);

    return (
        <Wrapper heading='Add Color' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Color"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
        </Wrapper>
    );
};

export default NewColorPage;