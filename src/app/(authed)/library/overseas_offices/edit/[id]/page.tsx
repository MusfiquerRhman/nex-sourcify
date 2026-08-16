'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useOverseasForm } from "../../config/useOverseasForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditOverseasOfficePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: officeData, isLoading } = api.overseasOffices.getOverseasOfficeById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useOverseasForm(officeData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateOverseasOffice = api.overseasOffices.updateOverseasOffice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Overseas Office updated successfully!");
            await utils.overseasOffices.getOverseasOffices.invalidate();
            await utils.overseasOffices.getOverseasOfficeById.invalidate({ id });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {  
            id: id,
            ...data,
            currency_id: data.currency_id ? Number(data.currency_id) : undefined,
            country_id: data.country_id ? Number(data.country_id) : undefined,
        };  

        try {
            await updateOverseasOffice.mutateAsync(payload);
        } 
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating overseas office: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateOverseasOffice]);

    return (
        <Wrapper heading="Update Overseas Office">
            <Form fields={formFields} 
                onSubmit={onSubmit} 
                buttonLabel="Update Overseas Office" 
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

export default EditOverseasOfficePage;