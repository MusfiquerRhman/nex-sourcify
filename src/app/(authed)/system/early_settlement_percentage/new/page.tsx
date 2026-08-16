'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useEarlySettlementPercentageForm } from "../config/useEarlySettlementPercentageForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewEarlySettlementPercentagePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useEarlySettlementPercentageForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addCommissionPercentage = api.earlySettlementPercentage.addEarlySettlementPercentage.useMutation({
        onSuccess: async () => {
            toast.success("Early Settlement Percentage added successfully!");
            await Promise.all([
                utils.earlySettlementPercentage.getEarlySettlementPercentage.invalidate(),
                utils.earlySettlementPercentage.searchEarlySettlementPercentages.invalidate(),
                utils.earlySettlementPercentage.getBuyersForEarlySettlementPercentage.invalidate()
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
            toast.error(`Failed to add Early Settlement Percentage: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addCommissionPercentage, reset]);

    return (
        <Wrapper heading='Add Early Settlement' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add Early Settlement"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewEarlySettlementPercentagePage;