'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useSalesContactPersonForm } from "../../config/useScContactPersonForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditScContactPersonPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: contactPersonData, isLoading } = api.scContactPerson.getContactPersonById.useQuery({ id: Number(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useSalesContactPersonForm(contactPersonData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateContactPerson = api.scContactPerson.updateContactPerson.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Contact person updated successfully!");
            await utils.scContactPerson.getContactPersons.invalidate();
            await utils.scContactPerson.getContactPersonById.invalidate({ id: Number(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            id: Number(id),
            ...data,
        };
        
        try {
            await updateContactPerson.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating contact person: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateContactPerson]);

    return (
        <Wrapper heading='Update Contact Person' >
            <Form
                fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Contact Person"
                register={methods.register}
                isLoading={isLoadingSubmit || isLoading}
                validationError={validationError}
                error={error}
                control={control}
                disabled={!can_update}
            />
        </Wrapper>
    );
};

export default EditScContactPersonPage;
