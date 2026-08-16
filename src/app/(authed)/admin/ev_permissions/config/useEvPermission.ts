import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetEvPermissionByIdTypes } from "~/types/adminAPITypes";

export const useEvPermission = (initialData?: GetEvPermissionByIdTypes) => {
    const defaultValues: FormValues = {
        buyer_id: initialData?.buyer_id ?? 0,
        user_id: initialData?.user_id ?? '',
        bd_id: initialData?.id,
    };

    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

    // Effect to reset form when fabricData changes
    useEffect(() => {
        if (initialData) {
            methods.reset({
                buyer_id: initialData.buyer_id != null ? initialData.buyer_id : 0,
                user_id: initialData.user_id != null ? initialData.user_id : '',
                bd_id: initialData.id,
            });
        }
    }, [initialData, methods]);


    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(!!initialData), validationError, control, reset };
};