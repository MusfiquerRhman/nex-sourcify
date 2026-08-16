'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useProductTypeForm } from "../../config/useProductTypeForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";   

const EditProductTypePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: productTypeData, isLoading } = api.productType.getProductTypeById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError } = useProductTypeForm(productTypeData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateProductType = api.productType.updateProductType.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Product Type updated successfully!");
            await utils.productType.getProductTypes.invalidate();
            await utils.productType.getProductTypeById.invalidate({ id: parseInt(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {  
            id: parseInt(id),
            ...data,
        };

        try {
            await updateProductType.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating product type: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateProductType]);

    return (
        <Wrapper heading="Update Product Type">
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Product Type"
                register={methods.register}
                validationError={validationError}
                isLoading={isLoading || isLoadingSubmit}
                error={error}
                disabled={!can_update}
            />
        </Wrapper>
    );
};

export default EditProductTypePage;