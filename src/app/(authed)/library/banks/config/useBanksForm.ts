import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";

import type { GetBankByIdTypes } from "~/types/libraryAPITypes";

export const useBanksForm = (bankData?: GetBankByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: bankData ? { name: bankData.name, country_id: bankData.country_id?.toString() } : {},
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

    // Effect to reset form when bankData changes
    useEffect(() => {
        if (bankData) {
            methods.reset({
                ...bankData,
                country_id: bankData.country_id ? bankData.country_id.toString() : undefined,
            });
        }
    }, [bankData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};