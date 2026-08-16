import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetCourierByIdTypes } from "~/types/libraryAPITypes";

export const useCourierForm = (courierData?: GetCourierByIdTypes) => {
    // Transform courierData to match form schema (convert null to undefined and exclude id)
    const transformDefaultValues = (data?: GetCourierByIdTypes) => {
        if (!data) {
            return { name: "" };
        }
        return {
            name: data.name,
            phone_no: data.phone_no ?? undefined,
            email: data.email ?? undefined,
            address: data.address ?? undefined,
            contact_person: data.contact_person ?? undefined,
            website: data.website ?? undefined,
        };
    };

    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: transformDefaultValues(courierData),
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

    // Effect to reset form when courierData changes
    useEffect(() => {
        if (courierData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    name: courierData.name,
                    phone_no: courierData.phone_no,
                    email: courierData.email,
                    contact_person: courierData.contact_person,
                    website: courierData.website,
                    address: courierData.address,
                }).map(([key, value]) => [key, value ?? undefined])
            );
            methods.reset(transformedData);
        }
    }, [courierData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, reset };
};