'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { usePaymentTermsForm } from "../config/usePaymentTermsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewPaymentTermsPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = usePaymentTermsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addPaymentTerm = api.paymentTerms.addPaymentTerm.useMutation({
        onSuccess: async () => {
            reset();
            setError(null);
            toast.success("Payment Term added successfully!");
            await utils.paymentTerms.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            terms_id: Number(data.terms_id),
            tenor: Number(data.tenor),
            term_description: data.term_description ?? "",
        };
        try {
            await addPaymentTerm.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Payment Term: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addPaymentTerm, reset]);

    return (
        <Wrapper heading='Add Payment Term' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Payment Term" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewPaymentTermsPage;