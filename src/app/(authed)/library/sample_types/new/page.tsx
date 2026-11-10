'use client';

import { Form, Wrapper } from "~/components";
import { useState, useEffect  } from "react";
import { useSampleTypesForm } from "../config/useSampleTypesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewSampleTypePage = () => {
    const { methods, handleSubmit, formFields, validationError, reset } = useSampleTypesForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const utils = api.useUtils();

    const addSampleType = api.sampleTypes.addSampleType.useMutation({
        onSuccess: async () => {
            setError(null);
            reset();
            toast.success("Sample type added successfully!");
            await utils.sampleTypes.invalidate();
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        setIsLoading(true);

        try {
            await addSampleType.mutateAsync(data);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add sample type: ${message}`);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading="Add Sample Type">
            <Form
                fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Add New Sample Type"
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
        </Wrapper>
    );
};

export default NewSampleTypePage;
