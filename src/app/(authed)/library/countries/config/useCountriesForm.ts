import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetCountryByIdTypes } from "~/types/libraryAPITypes";

export const useCountryForm = (countryData?: GetCountryByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: countryData ? {
            ...countryData,
            country_code: countryData.country_code ?? "",
        } : {
            name: "",
            country_code: "",
        },
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

    // Effect to reset form when countryData changes
    useEffect(() => {
        if (countryData) {
            methods.reset({
                name: countryData.name,
                country_code: countryData.country_code ?? undefined,
            });
        }
    }, [countryData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);


    return { methods, handleSubmit, formFields: formFields(), validationError, reset };
};