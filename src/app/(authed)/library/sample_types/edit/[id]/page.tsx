'use client';

import { Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { useSampleTypesForm } from "../../config/useSampleTypesForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditSampleTypePage = (props: ParamsProp) => {
    const { params } = props;
    const { id } = React.use(params);
    const sampleTypeId = Number(id);
    const { can_update } = useModulePermissions();
    const [error, setError] = useState<string | null>(null);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const { data: sampleTypeData, isLoading, error: queryError } = api.sampleTypes.getSampleTypeById.useQuery({ id: sampleTypeId });
    const { methods, handleSubmit, formFields, validationError } = useSampleTypesForm(sampleTypeData);
    const utils = api.useUtils();

    const updateSampleType = api.sampleTypes.updateSampleType.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Sample type updated successfully!");
            await utils.sampleTypes.invalidate();
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        setIsLoadingSubmit(true);

        try {
            await updateSampleType.mutateAsync({ id: sampleTypeId, ...data });
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating sample type: ${message}`);
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    });

    return (
        <Wrapper heading="Update Sample Type">
            <Form
                fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Update Sample Type"
                register={methods.register}
                validationError={validationError}
                isLoading={isLoadingSubmit || isLoading}
                error={error ?? (queryError ? parseTRPCError(queryError) : null)}
                disabled={!can_update || !sampleTypeData}
            />
        </Wrapper>
    );
};

export default EditSampleTypePage;
