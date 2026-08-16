import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import type { GetTnaBaseActionByIdTypes } from "~/types/libraryAPITypes";

export const useTnaBaseActionForm = (tnaData?: GetTnaBaseActionByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: tnaData ? {
            ...tnaData,
            buyer_id: tnaData.buyer_id.toString(),
            action_id: tnaData.action_id.toString(),
        } : {
            buyer_id: "",
            action_id: "",
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (tnaData) {
            methods.reset({
                ...tnaData,
                buyer_id: tnaData.buyer_id ? tnaData.buyer_id.toString() : undefined,
                action_id: tnaData.action_id ? tnaData.action_id.toString() : undefined,
            });
        }
    }, [tnaData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, validationError, control, reset };
};