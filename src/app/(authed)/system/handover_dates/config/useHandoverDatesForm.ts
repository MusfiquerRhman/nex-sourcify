import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetHandoverDateByIdTypes } from "~/types/libraryAPITypes";

export const useHandoverDatesForm = (handoverData?: GetHandoverDateByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            buyer_id: handoverData?.buyer_id ? handoverData.buyer_id.toString() : "",
            buffer: handoverData?.buffer ?? 7,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Effect to reset form when handoverData changes
    useEffect(() => {
        if (handoverData) {
            methods.reset({
                ...handoverData,
                buyer_id: handoverData.buyer_id ? handoverData.buyer_id.toString() : undefined,
            });
        }
    }, [handoverData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
}