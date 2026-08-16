'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFreightTerm } from "../config/useFreightTerm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewFreightTermPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useFreightTerm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addFreightTerm = api.freightTerms.addFreightTerm.useMutation({
        onSuccess: async () => {
            toast.success("Freight Term added successfully!");
            setError(null);
            reset();
            await Promise.all([
                utils.freightTerms.getFreightTerms.invalidate(),
                utils.freightTerms.searchFreightTerms.invalidate()
            ]);
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            await addFreightTerm.mutateAsync(data);
        }
        catch(error){
            const message = parseTRPCError(error);
            toast.error(`Error adding Freight Term: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addFreightTerm, reset]);

    return (
        <Wrapper heading='Add Freight Term' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Add New Freight Term"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}
        
export default NewFreightTermPage;