'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useProductTypeForm } from "../config/useProductTypeForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewProductTypePage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, reset } = useProductTypeForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addProductType = api.productType.addProductType.useMutation({
        onSuccess: async () => {
            setError(null);
            reset();
            toast.success("Product Type added successfully!");
            await utils.productType.getProductTypes.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            await addProductType.mutateAsync(data);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding product type: ${message}`);
            setError(message);
        }
        finally { 
            setIsLoading(false);
        }
    }), [handleSubmit, addProductType, reset]);

    return (
        <Wrapper heading='Add Product Type' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Product Type" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
        </Wrapper>
    );
}

export default NewProductTypePage;