import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetSampleTypeByIdTypes } from "~/types/libraryAPITypes";

export const useSampleTypesForm = (sampleTypeData?: GetSampleTypeByIdTypes) => {
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: sampleTypeData?.name ?? "" },
    });
    const { handleSubmit, formState: { errors: validationError }, setFocus, watch, setValue, reset } = methods;
    const nameValue = watch("name");

    useEffect(() => {
        if (nameValue && nameValue !== nameValue.toUpperCase()) {
            setValue("name", nameValue.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    }, [nameValue, setValue]);

    useEffect(() => {
        if (sampleTypeData) reset({ name: sampleTypeData.name });
    }, [sampleTypeData, reset]);

    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, reset };
};
