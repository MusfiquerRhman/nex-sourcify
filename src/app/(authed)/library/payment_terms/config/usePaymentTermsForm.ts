import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetPaymentTermByIdTypes } from "~/types/libraryAPITypes";

export const usePaymentTermsForm = (paymentTermData?: GetPaymentTermByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: paymentTermData ? {
            terms_id: paymentTermData.terms_id?.toString(),
            tenor: paymentTermData.tenor ? Number(paymentTermData.tenor) : 0,
            term_description: paymentTermData.term_description,
        } : {},
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, watch, setValue, reset } = methods;

    const nameValue = watch("term_description");

    useEffect(() => {
    if (nameValue && nameValue !== nameValue.toUpperCase()) {
        setValue("term_description", nameValue.toUpperCase(), {
        shouldValidate: true,
        shouldDirty: true,
        });
    }
    }, [nameValue, setValue]);

    // Effect to reset form when paymentTermData changes
    useEffect(() => {
        if (paymentTermData) {
            methods.reset({
                ...paymentTermData,
                terms_id: paymentTermData.terms_id ? paymentTermData.terms_id.toString() : undefined,
                tenor: paymentTermData.tenor ? Number(paymentTermData.tenor) : 0,
            });
        }
    }, [paymentTermData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, control, reset };
};