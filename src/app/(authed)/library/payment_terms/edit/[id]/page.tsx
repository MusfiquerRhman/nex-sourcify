'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { usePaymentTermsForm } from "../../config/usePaymentTermsForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditPaymentTermsPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    
    const { data: paymentTermData, isLoading } = api.paymentTerms.getPaymentTermById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = usePaymentTermsForm(paymentTermData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updatePaymentTerm = api.paymentTerms.updatePaymentTerm.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Payment Term updated successfully!");
            await utils.paymentTerms.getPaymentTerms.invalidate();
            await utils.paymentTerms.getPaymentTermById.invalidate({ id: parseInt(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {
            id: parseInt(id),
            ...data,
            terms_id: Number(data.terms_id),
            tenor: Number(data.tenor),
            term_description: data.term_description ?? "",
        };
        
        try {
            await updatePaymentTerm.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating payment term: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updatePaymentTerm]);

    return (
        <Wrapper heading="Update Payment Term">
            <Form fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Payment Term"
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

export default EditPaymentTermsPage;