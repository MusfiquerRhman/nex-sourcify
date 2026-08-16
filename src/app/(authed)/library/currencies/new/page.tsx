'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCurrenciesForm } from "../config/useCurrenciesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewCurrencyPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, reset } = useCurrenciesForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils() ;

    const addCurrency = api.currencies.addCurrency.useMutation({
        onSuccess: async () => {
            toast.success("Currency added successfully!");
            setError(null);
            reset();
            await utils.currencies.getCurrencies.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => { 
        setIsLoading(true);
        const payload = {
            symbol: data.symbol,
            name: data.name,
            currency_code: data.currency_code
        };
        try {
            await addCurrency.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding currency: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addCurrency, reset]);

    return (
        <Wrapper heading='Add Currency' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Currency" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
        </Wrapper>
    );
}

export default NewCurrencyPage;