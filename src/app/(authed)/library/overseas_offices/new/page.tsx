'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useOverseasForm } from "../config/useOverseasForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewOverseasOfficePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useOverseasForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addOverseasOffice = api.overseasOffices.addOverseasOffice.useMutation({
        onSuccess: async () => {
            setError(null);
            reset();
            toast.success("Overseas Office added successfully!");
            await utils.overseasOffices.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            currency_id: data.currency_id ? Number(data.currency_id) : undefined,
            country_id: data.country_id ? Number(data.country_id) : undefined,
        };
        try {
            await addOverseasOffice.mutateAsync(payload);
        }
        catch(error){
            const message = parseTRPCError(error);
            toast.error(`Failed to add Overseas Office: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addOverseasOffice, reset]);

    return (
        <Wrapper heading='Add Overseas Office' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Overseas Office" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewOverseasOfficePage;