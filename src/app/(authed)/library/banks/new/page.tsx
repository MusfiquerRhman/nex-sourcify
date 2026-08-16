'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useBanksForm } from "../config/useBanksForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { safeNumber } from "~/utils/numbers";

const NewBankPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useBanksForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addBank = api.banks.addBank.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Bank added successfully!");
            await utils.banks.invalidate();
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            country_id: data.country_id ? safeNumber(data.country_id) : undefined,
        };
        try {
            await addBank.mutateAsync(payload);
        }
        catch(error){
            const message = parseTRPCError(error);
            toast.error(`Failed to add Bank: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [addBank, reset]);

    return (
        <Wrapper heading='Add Bank' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Bank" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewBankPage;