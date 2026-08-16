'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useTnaBaseActionForm } from "../config/useTnaBaseActionForm";
import { formFields } from "../config/formFields";

const NewTnaBaseActionPage = () => {
    // Form setup
    const { methods, handleSubmit, validationError, control, reset } = useTnaBaseActionForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addTnaBaseAction = api.tnaBaseAction.createTnaBaseAction.useMutation({
        onSuccess: async () => {
            setError(null);
            reset();
            toast.success("TNA Base Action added successfully!");
            await Promise.all([
                utils.tnaBaseAction.getAllTnaBaseActions.invalidate(),
                utils.tnaBaseAction.searchTnaBaseActions.invalidate(),
                utils.tnaBaseAction.getBuyersForTnaBaseAction.invalidate(),
            ]);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            buyer_id: Number(data.buyer_id),
            tna_action_id: Number(data.action_id),
        };
        try {
            await addTnaBaseAction.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add TNA Base Action: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addTnaBaseAction, reset]);

    return (    
        <Wrapper heading='Add Base TNA Action' >
            <Form fields={formFields()}
                onSubmit={onSubmit}
                buttonLabel="Add New Base TNA Action"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewTnaBaseActionPage;