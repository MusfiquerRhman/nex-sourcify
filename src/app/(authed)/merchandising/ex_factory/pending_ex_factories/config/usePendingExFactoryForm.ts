import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { PendingExFactorySchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";

export const usePendingExFactoryForm = () => {
    const getDefaultValues = useCallback((): FormValues => {
        return {
            buyer_id: '',
            factory_id: '',
            from_date: formatDateForInput(new Date(Date.now() - 604800000)),
            to_date: formatDateForInput(new Date()),
        };
    }, []);

    const methods = useForm<FormValues>({
        resolver: zodResolver(PendingExFactorySchema),
        defaultValues: getDefaultValues(),
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, watch, control } = methods;

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return {
        methods,
        handleSubmit,
        formFields: useFormFields(),
        validationError,
        trigger,
        watch,
        control,
    };
}

