import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetFabricSupplierByIdTypes } from "~/types/libraryAPITypes";

export const useFabricSuppliersForm = (supplierData?: GetFabricSupplierByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: supplierData ? {
            name: supplierData.name ?? undefined,
            country_id: supplierData.country_id?.toString(),
        } : {
            name: "",
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

    const nameValue = watch("name");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("name", nameValue.toUpperCase(), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    // Effect to reset form when supplierData changes
    useEffect(() => {
        if (supplierData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    name: supplierData.name,
                    phone_no: supplierData.phone_no,
                    email: supplierData.email,
                    contact_person: supplierData.contact_person,
                    address: supplierData.address,
                    website: supplierData.website,
                    country_id: supplierData.country_id ? supplierData.country_id.toString() : undefined,
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [supplierData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
}