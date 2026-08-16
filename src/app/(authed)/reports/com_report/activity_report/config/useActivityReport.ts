import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActivityReportFormSchema } from "./formSchema";
import type { ActivityReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";

export const useActivityReport = () => {
    const methods = useForm<ActivityReportFormValues>({
        resolver: zodResolver(ActivityReportFormSchema),
        defaultValues: {
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const formFields = useFormFields();

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}