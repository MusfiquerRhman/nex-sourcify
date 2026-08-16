import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetProductByIdTypes } from "~/types/libraryAPITypes";

export const useProductsForm = (productData?: GetProductByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: productData ? {
            ...productData,
            product_type_id: productData.product_type_id ? productData.product_type_id.toString() : undefined,
            is_active: productData.is_active ?? undefined,
        } : {
            name: "",
            is_active: true,
        },
    });

    const { handleSubmit, watch, formState: { errors: validationError }, setFocus, control, setValue, reset } = methods;

    const nameValue = watch("name");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("name", nameValue.toUpperCase(), {
        shouldValidate: true,
        shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    const checked = watch("is_active");
    // Effect to reset form when productData changes
    useEffect(() => {
        if (productData) {
            const transformedData = Object.fromEntries(
                Object.entries({
                    ...productData,
                    product_type_id: productData.product_type_id ? productData.product_type_id.toString() : undefined,
                }).map(([key, value]) => [key, value === null ? undefined : value])
            );
            methods.reset(transformedData);
        }
    }, [productData]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields({ checked }), validationError, control, reset };
};