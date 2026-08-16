import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetTnaActionByIdTypes } from "~/types/libraryAPITypes";

export const useTnaForm = (tnaData?: GetTnaActionByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: tnaData ? Object.fromEntries(
            Object.entries({
                ...tnaData,
                department_id: tnaData.department_id ? tnaData.department_id.toString() : undefined,
            }).map(([key, value]) => [key, value === null ? undefined : value])
        ) : {
            name: "",
            lead_time: 0,
            alert_before: 0,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (tnaData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...tnaData,
                    department_id: tnaData.department_id ? tnaData.department_id.toString() : undefined,
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [tnaData, methods]);

    const nameValue = watch("name");

    useEffect(() => {
        if (nameValue && nameValue !== nameValue.toUpperCase()) {
            setValue("name", nameValue.toUpperCase(), {
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

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};