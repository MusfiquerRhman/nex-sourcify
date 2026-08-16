import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetCurrencyByIdTypes } from "~/types/libraryAPITypes";

export const useCurrenciesForm = (currencyData?: GetCurrencyByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: currencyData ? {
            name: currencyData.name  ,
            symbol: currencyData.symbol  ,
            currency_code: currencyData.currency_code ?? undefined  ,
        } : {
            name: "",
            symbol: "",
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

    // Effect to reset form when currencyData changes
    useEffect(() => {
        if (currencyData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    name: currencyData.name,
                    symbol: currencyData.symbol,
                    currency_code: currencyData.currency_code,
                }).map(([key, value]) => [key, value ?? undefined])
            );
            methods.reset(transformedData);
        }
    }, [currencyData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, reset };
};