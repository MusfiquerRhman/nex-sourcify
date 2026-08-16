'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useProductsForm } from "../../config/useProductsForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditProductPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: productData, isLoading } = api.products.getProductById.useQuery({ id: Number(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useProductsForm(productData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateProduct = api.products.updateProduct.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Product updated successfully!");
            await utils.products.getProducts.invalidate();
            await utils.products.getProductById.invalidate({ id: Number(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {   
            id: Number(id),
            ...data,
            product_type_id: data.product_type_id ? Number(data.product_type_id) : undefined,
        };
        
        try {
            await updateProduct.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating product: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateProduct]);

    return (
        <Wrapper heading="Update Product">
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Product"
                register={methods.register}
                validationError={validationError}
                isLoading={isLoading || isLoadingSubmit}
                error={error}
                disabled={!can_update}
                control={control}
            />
        </Wrapper>
    );
};

export default EditProductPage;