import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetToleranceLevelByIdTypes } from "~/types/libraryAPITypes";

export const useTolerance = (toleranceData?: GetToleranceLevelByIdTypes) => {
    const defaultValues = toleranceData
        ? {
            buyer_id: toleranceData.buyer_id ?? undefined,
            tolerance_percentage: toleranceData.tolerance_level ?? 0,
        }
        : undefined;

    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

    // Effect to reset form when fabricData changes
    useEffect(() => {
        if (toleranceData) {
            methods.reset({
                buyer_id: toleranceData.buyer_id ?? undefined,
                tolerance_percentage: toleranceData.tolerance_level ?? 0,
            });
        }
    }, [toleranceData, methods]);


    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(!!toleranceData), validationError, control, reset };
};