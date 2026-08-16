'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useProductsForm } from "../config/useProductsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewProductPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useProductsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addProduct = api.products.addProducts.useMutation({
        onSuccess: async () => {
            reset();
            setError(null);
            toast.success("Product added successfully!");
            await utils.products.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            ...data,
            product_type_id: data.product_type_id ? Number(data.product_type_id) : undefined,
        };
        try {
            await addProduct.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Product: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addProduct, reset]);

    return (
        <Wrapper heading='Add Product' >
            <Form
                fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Product" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewProductPage;