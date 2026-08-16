'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCommissionPercentageForm } from "../config/useCommissionPercentageForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewCommissionPercentagePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useCommissionPercentageForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addCommissionPercentage = api.commissionPercentage.addCommission.useMutation({
        onSuccess: async () => {
            toast.success("Commission Percentage added successfully!");
            await Promise.all([
                utils.commissionPercentage.getCommissions.invalidate(),
                utils.commissionPercentage.searchCommissions.invalidate(),
                utils.commissionPercentage.getBuyerForCommissionPercentage.invalidate()
            ])
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
            await addCommissionPercentage.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Commission Percentage: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addCommissionPercentage, reset]);

    return (
        <Wrapper heading='Add Commission Percentage' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add Commission Percentage"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewCommissionPercentagePage;