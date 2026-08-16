'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useBanksForm } from "../../config/useBanksForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditBankPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: bankData, isLoading } = api.banks.getBankById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useBanksForm(bankData);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    // TRPC utils
    const utils = api.useUtils();

    const updateBank = api.banks.updateBank.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Bank updated successfully!");
            await utils.banks.getBankById.invalidate({ id });
            await utils.banks.getBanks.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            id: safeNumber(id),
            ...data,
            country_id: data.country_id ? safeNumber(data.country_id) : undefined,
        };

        try {
            await updateBank.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update bank: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [updateBank, id]);

    return (
        <Wrapper heading="Update Banks">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Banks" 
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

export default EditBankPage;