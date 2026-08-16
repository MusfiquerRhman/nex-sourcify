import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetFabricByIdTypes } from "~/types/libraryAPITypes";

export const useFabrics = (fabricData?: GetFabricByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: fabricData ? Object.fromEntries(
            Object.entries(fabricData).map(([key, value]) => [key, value === null ? undefined : value])
        ) : {},
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

    const descriptionValue = watch("description");
    const compositionValue = watch("composition");
    const valueValue = watch("value");
    const unit = watch("unit");

    useEffect(() => {
        setValue("name", 
            `${descriptionValue ?? ''}${compositionValue ? ` ${compositionValue}` : ""} ${valueValue ? valueValue : ''} ${unit ?? ''}`.trim(),
            {
                shouldValidate: true,
                shouldDirty: true,
            }
        )
    }, [descriptionValue, compositionValue, valueValue, unit, setValue]);

    const nameValue = watch("name");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("name", nameValue.toUpperCase(), {
        shouldValidate: true,
        shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    // Effect to reset form when fabricData changes
    useEffect(() => {
        if (fabricData) {
            const transformedData = Object.fromEntries(
                Object.entries(fabricData).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [fabricData, methods]);


    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};