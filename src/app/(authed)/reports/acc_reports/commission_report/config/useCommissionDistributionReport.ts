import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateForInput } from "~/utils/localDateString";
import { useFormFields } from "./useFormFields";
import { commissionDistributionReportFormSchema } from "./formSchema";
import type { CommissionDistributionReportFormValues } from "./formSchema";

export const useCommissionDistributionReport = () => {
    const methods = useForm<CommissionDistributionReportFormValues>({
        resolver: zodResolver(commissionDistributionReportFormSchema),
        defaultValues: {
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
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