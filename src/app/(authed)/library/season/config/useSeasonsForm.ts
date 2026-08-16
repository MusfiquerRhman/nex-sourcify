import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetSeasonByIdTypes } from "~/types/libraryAPITypes";

export const useSeasonsForm = (seasonData?: GetSeasonByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: seasonData ? {
            ...seasonData,
            buyer_id: seasonData.buyer_id ? seasonData.buyer_id.toString() : "",
            active_status: seasonData.active_status ?? true,
        } : {
            season_name: "",
            buyer_id: "",
            active_status: true,
        },
    });

    const { handleSubmit, watch, formState: { errors: validationError }, setFocus, control, setValue, reset } = methods;

    const nameValue = watch("season_name");

    useEffect(() => {
        if (nameValue && nameValue !== nameValue.toUpperCase()) {
            setValue("season_name", nameValue.toUpperCase(), {
            shouldValidate: true,
            shouldDirty: true,
            });
        }
    }, [nameValue, setValue]);


    const checked = watch("active_status");

    // Effect to reset form when seasonData changes
    useEffect(() => {
        if (seasonData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...seasonData,
                    buyer_id: seasonData.buyer_id ? seasonData.buyer_id.toString() : undefined,
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [seasonData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const fields = formFields({checked});

    return { methods, handleSubmit, formFields: fields, validationError, control, reset };
}