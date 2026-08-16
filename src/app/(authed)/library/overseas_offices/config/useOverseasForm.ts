import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetOverseasOfficeByIdTypes } from "~/types/libraryAPITypes";

export const useOverseasForm = (officeData?: GetOverseasOfficeByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: officeData ? Object.fromEntries(
            Object.entries(officeData).map(([key, value]) => [key, value ?? undefined])
        ) as FormValues : {
            name: "",
        },
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

    // Effect to reset form when officeData changes
    useEffect(() => {
        if (officeData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...officeData,
                    currency_id: officeData.currency_id ? officeData.currency_id.toString() : undefined,
                    country_id: officeData.country_id ? officeData.country_id.toString() : undefined,
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [officeData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};