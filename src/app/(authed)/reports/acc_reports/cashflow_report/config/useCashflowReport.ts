import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormFields } from "./useFormFields";
import { cashflowReportFormSchema } from "./formSchema";
import type { CashflowReportFormValues } from "./formSchema";

export const useCashflowReport = () => {
    const methods = useForm<CashflowReportFormValues>({
        resolver: zodResolver(cashflowReportFormSchema),
        defaultValues: {
            buyer_ids: [],
            from_date: "",
            to_date: "",
        },
    });

    const { handleSubmit, formState: { errors: validationError }, control } = methods;

    return {
        methods,
        handleSubmit,
        formFields: useFormFields(),
        validationError,
        control,
    };
};
