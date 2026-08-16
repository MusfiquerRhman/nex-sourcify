import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetFactoryByIdTypes } from "~/types/libraryAPITypes";

export const useFactoriesForm = (factoryData?: GetFactoryByIdTypes['factory']) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: factoryData ? Object.fromEntries(
            Object.entries(factoryData).map(([key, value]) => [key, value ?? undefined])
        ) : {
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, watch, setValue, reset } = methods;

    const nameValue = watch("name");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("name", nameValue.toUpperCase(), {
        shouldValidate: true,
        shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    // Effect to reset form when factoryData changes
    useEffect(() => {
        if (factoryData) {
            const transformedData = Object.fromEntries(
                Object.entries(factoryData).map(([key, value]) => [key, value ?? undefined])
            );
            methods.reset(transformedData);
        }
    }, [factoryData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, trigger, reset };
};