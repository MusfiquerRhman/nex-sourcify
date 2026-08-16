'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useSalesContactPersonForm } from "../config/useScContactPersonForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewScContactPersonPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useSalesContactPersonForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addContactPerson = api.scContactPerson.addContactPerson.useMutation({
        onSuccess: async () => {
            reset();
            setError(null);
            toast.success("Contact person added successfully!");
            await utils.scContactPerson.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            await addContactPerson.mutateAsync(data);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add contact person: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addContactPerson, reset]);

    return (
        <Wrapper heading='Add Contact Person' >
            <Form
                fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Contact Person"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewScContactPersonPage;