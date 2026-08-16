'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCountryForm } from "../config/useCountriesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewCountryPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, reset } = useCountryForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addCountry = api.countries.addCountry.useMutation({
        onSuccess: async () => {
            toast.success("Country added successfully!");
            await utils.countries.invalidate();
            setError(null);
            reset();
        },
    });


    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            await addCountry.mutateAsync(data);
        }
        catch(error){
            const message = parseTRPCError(error);
            toast.error(`Failed to add country: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addCountry, reset]);

    return (
        <Wrapper heading='Add Country' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Country" 
                register={methods.register}
                isLoading={isLoading}
                error={error}
                validationError={validationError}
            />
        </Wrapper>
    );
};

export default NewCountryPage;