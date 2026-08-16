'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCountryForm } from "../../config/useCountriesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePath } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";
import type { ParamsProp } from "~/types/params";

const EditCountryPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);

    const { data: countryData, isLoading } = api.countries.getCountry.useQuery({ id: id });
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    // Form setup
    const { methods, handleSubmit, formFields, validationError } = useCountryForm(countryData);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    // TRPC utils
    const utils = api.useUtils();

    const updateCountry = api.countries.updateCountry.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Country updated successfully!");
            await utils.countries.getCountries.invalidate();
            await utils.countries.getCountry.invalidate({ id });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const country = {
            id: id,
            ...data
        };
        try {
            await updateCountry.mutateAsync(country);
        } 
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update country: ${message}`);
            setError(message);
        } 
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateCountry]);

    return (
        <Wrapper heading="Update Country">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Country" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={!can_update}
            />
        </Wrapper>
    );
};

export default EditCountryPage;