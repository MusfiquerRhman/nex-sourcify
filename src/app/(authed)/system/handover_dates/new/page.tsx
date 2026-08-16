'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useHandoverDatesForm } from "../config/useHandoverDatesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewHandoverDatePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useHandoverDatesForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addHandoverDate = api.handoverDates.addHandoverDate.useMutation({
        onSuccess: async () => {
            toast.success("Handover Date added successfully!");
            await utils.handoverDates.getHandoverDates.invalidate();
            setError(null);
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            buyer_id: Number(data.buyer_id),
        };
        try {
            await addHandoverDate.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Handover Date: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addHandoverDate, reset]);

    return (
        <Wrapper heading='Add Handover Date' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Handover Date"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewHandoverDatePage;