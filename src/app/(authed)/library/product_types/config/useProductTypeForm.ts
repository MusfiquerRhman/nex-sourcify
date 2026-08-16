import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetProductTypeByIdTypes } from "~/types/libraryAPITypes";

export const useProductTypeForm = (productTypeData?: GetProductTypeByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({   
        resolver: zodResolver(formSchema),
        defaultValues: productTypeData ? {
            ...productTypeData,
            is_active: productTypeData.is_active ?? false,
        } : {
            name: "",
            is_active: true,
        },
    });

    const { handleSubmit, watch, formState: { errors: validationError }, setFocus, setValue, reset } = methods;

    const nameValue = watch("name");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("name", nameValue.toUpperCase(), {
        shouldValidate: true,
        shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    const checked = watch("is_active");

    // Effect to reset form when productTypeData changes
    useEffect(() => {
        if (productTypeData) {
            methods.reset({
                ...productTypeData,
                is_active: productTypeData.is_active ?? false,
            });
        }
    }, [productTypeData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const fields = formFields({checked});

    return { methods, handleSubmit, formFields: fields, validationError, reset };
};