'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useTnaForm } from "../config/useTnaForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewTnaActionPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useTnaForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addTnaAction = api.tnaActions.addTnaAction.useMutation({
        onSuccess: async () => {
            setError(null);
            reset();
            toast.success("TNA Action added successfully!");
            await utils.tnaActions.getTnaActions.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            department_id: Number(data.department_id),
        };
        try {
            await addTnaAction.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add TNA Action: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addTnaAction, reset]);

    return (    
        <Wrapper heading='Add TNA Action' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New TNA Action"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewTnaActionPage;