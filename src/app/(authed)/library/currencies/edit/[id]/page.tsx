'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCurrenciesForm } from "../../config/useCurrenciesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditCurrencyPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);

    const { data: currencyData, isLoading } = api.currencies.getCurrencyById.useQuery({ id: id });
    const [error, setError] = useState<string | null>(null);

    // Form setup
    const { methods, handleSubmit, formFields, validationError } = useCurrenciesForm(currencyData);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateCurrency = api.currencies.updateCurrency.useMutation({
        onSuccess: async () => {
            toast.success("Currency updated successfully!");
            setError(null);
            await Promise.all([
                utils.currencies.getCurrencies.invalidate(),
                utils.currencies.getCurrencyById.invalidate({ id })
            ]);
        }
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const currency = {
            id: id,
            symbol: data.symbol,
            name: data.name,
            currency_code: data.currency_code
        };
        try {
            await updateCurrency.mutateAsync(currency);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating currency: ${message}`);
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateCurrency]);

    return (
        <Wrapper heading="Update Currency">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Currency" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={!can_update}
            />
        </Wrapper>
    );
};

export default EditCurrencyPage;