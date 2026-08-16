import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetCompanyByIdTypes } from "~/types/libraryAPITypes";

export const useCompaniesForm = (companyData?: GetCompanyByIdTypes['company']) => {
    // Form setup
    const transformedDefaultValues = companyData
        ? Object.fromEntries(
              Object.entries(companyData).map(([key, value]) => [key, value === null ? undefined : value])
          )
        : {};

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: transformedDefaultValues,
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, control, watch, setValue, reset } = methods;

    // Effect to reset form when companyData changes

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
        if (companyData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...companyData,
                    currencies_id: companyData.currencies_id ?? undefined,
                    country_id: companyData.country_id ?? undefined,
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [companyData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, trigger, control, reset };
};
