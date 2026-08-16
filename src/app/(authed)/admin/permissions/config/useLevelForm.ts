import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";

export const useLevelForm = () => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    const { handleSubmit, formState: { errors: validationError }, control } = methods;

    return { methods, handleSubmit, formFields: formFields(), validationError, control };
}