import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetFobTypeByIdTypes } from "~/types/libraryAPITypes";

export const useFobType = (fobTypeData?: GetFobTypeByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: fobTypeData ?? {}
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

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
        if (fobTypeData) {
            methods.reset({
                ...fobTypeData,
            });
        }
    }, [fobTypeData, methods]);


    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};