'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useTolerance } from "../config/useTolerance";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewShipmentTolerancePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useTolerance();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addTolerance = api.toleranceLevel.addTolerance.useMutation({
        onSuccess: async () => {
            toast.success("Shipment Tolerance added successfully!");
            await Promise.all([
                utils.toleranceLevel.getTolerance.invalidate(),
                utils.toleranceLevel.searchTolerance.invalidate()
            ]);
            setError(null);
            reset();
        }
    });

    const onSubmit = useCallback(handleSubmit(async (data) => { 
        setIsLoading(true);
        try {
            await addTolerance.mutateAsync({
                buyer_id: Number(data.buyer_id),
                tolerance_level: data.tolerance_percentage
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding shipment tolerance: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addTolerance, reset]);

    return (
        <Wrapper heading='Add Shipment Tolerance' >
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Add New Shipment Tolerance"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewShipmentTolerancePage;