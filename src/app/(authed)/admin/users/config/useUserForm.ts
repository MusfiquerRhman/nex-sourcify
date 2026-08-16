import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetUserTypes } from '~/types/adminAPITypes'

export const useUserForm = (userData?: GetUserTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            is_active: true,
        },
    });
    
    const { handleSubmit, watch, formState: { errors: validationError }, setFocus, control } = methods;
    
    const checked = watch("is_active");
   
    // If editing, populate form with existing data
    useEffect(() => {
        if (userData) {
            const formValues = {
                first_name: userData.first_name,
                last_name: userData.last_name ?? "",
                user_id: userData.user_id ?? "",
                department_id: userData.department_id,
                password: userData.password,
                confirmPassword: userData.password,
                level_id: userData.level_id,
                is_active: userData.is_active,
                email: userData.email ?? "",
                phone_no: userData.phone_no ?? "",
            };
            methods.reset(formValues);
        }
    }, [userData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    // Dynamic field config
    const fields = formFields({checked});

    return { methods, handleSubmit, fields, validationError, control };
};
