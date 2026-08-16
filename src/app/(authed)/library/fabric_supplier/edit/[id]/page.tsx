'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useFabricSuppliersForm } from "../../config/useFabricSuppliersForm";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditFabricSupplierPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: supplierData, isLoading } = api.fabricSuppliers.getFabricSupplierById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFabricSuppliersForm(supplierData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateFabricSupplier = api.fabricSuppliers.updateFabricSupplier.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Fabric Supplier updated successfully!");
            await utils.fabricSuppliers.getFabricSuppliers.invalidate();
            await utils.fabricSuppliers.getFabricSupplierById.invalidate({ id });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            id: Number(id), // Convert id to a number
            ...data,
            country_id: data.country_id ? Number(data.country_id) : undefined,
        };

        try {
            await updateFabricSupplier.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Fabric Supplier: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateFabricSupplier]);

    return (
        <Wrapper heading="Update Fabric Supplier">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Fabric Supplier" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={!can_update}
                control={control}
            />
        </Wrapper>
    );
};

export default EditFabricSupplierPage;