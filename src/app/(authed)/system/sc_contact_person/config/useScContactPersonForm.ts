import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetScContactPersonByIdTypes } from "~/types/libraryAPITypes";

export const useSalesContactPersonForm = (productData?: GetScContactPersonByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: productData ? Object.fromEntries(
            Object.entries(productData).map(([key, value]) => [key, value ?? undefined])
        ) : {
            name: "",
        },
    });

    const { handleSubmit, watch, formState: { errors: validationError }, setFocus, control, setValue, reset } = methods;

    const nameValue = watch("name");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("name", nameValue.toUpperCase(), {
        shouldValidate: true,
        shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    // Effect to reset form when productData changes
    useEffect(() => {
        if (productData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...productData,
                }).map(([key, value]) => [key, value ?? undefined])
            );
            methods.reset(transformedData);
        }
    }, [productData]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};