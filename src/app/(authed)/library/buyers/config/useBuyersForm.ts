import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetBuyerByIdTypes } from "~/types/libraryAPITypes";

export const useBuyersForm = (buyerData?: GetBuyerByIdTypes['buyer']) => {
    // Form setup
    const transformedBuyerData = buyerData ? Object.fromEntries(
        Object.entries(buyerData).map(([key, value]) => [key, value === null ? undefined : value])
    ) : undefined;

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: transformedBuyerData ?? {
            buyer_name: "",
            short_name: "",
            prefix: "",
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, control, watch, setValue, reset } = methods;

    // Effect to reset form when buyerData changes
    useEffect(() => {
        if (buyerData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...buyerData,
                    country_id: buyerData.country_id ? buyerData.country_id.toString() : undefined,
                    overseas_office_id: buyerData.overseas_office_id ? buyerData.overseas_office_id.toString() : undefined,
                    paymentTerms: buyerData.payment_terms ? buyerData.payment_terms.value : [],
                    destinations: buyerData.destinations ? buyerData.destinations.value : [],
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [buyerData, methods]);

    const nameValue = watch("buyer_name");

    useEffect(() => {
        if (nameValue && nameValue !== nameValue.toUpperCase()) {
            setValue("buyer_name", nameValue.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    }, [nameValue, setValue]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, trigger, control, reset };
};