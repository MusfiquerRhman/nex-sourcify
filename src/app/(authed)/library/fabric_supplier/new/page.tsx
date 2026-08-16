'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useFabricSuppliersForm } from "../config/useFabricSuppliersForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewFabricSupplierPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useFabricSuppliersForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addFabricSupplier = api.fabricSuppliers.addFabricSupplier.useMutation({
        onSuccess: async () => {
            toast.success("Fabric Supplier added successfully!");
            await utils.fabricSuppliers.invalidate();
            setError(null);
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            country_id: data.country_id ? Number(data.country_id) : undefined,
        };
        try {
            await addFabricSupplier.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Fabric Supplier: ${message}`);
            setError(message ?? "");
        }
        finally{
            setIsLoading(false);
        }
    }), [handleSubmit, addFabricSupplier, reset]);

    return (
        <Wrapper heading='Add Fabric Supplier' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Fabric Supplier" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewFabricSupplierPage;
