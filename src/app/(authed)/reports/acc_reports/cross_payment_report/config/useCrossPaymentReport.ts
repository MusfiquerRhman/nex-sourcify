import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateForInput } from "~/utils/localDateString";
import { useFormFields } from "./useFormFields";
import { crossPayReportFormSchema } from "./formSchema";
import type { CrossPayReportFormValues } from "./formSchema";

export const useCrossPaymentReport = () => {
    const methods = useForm<CrossPayReportFormValues>({
        resolver: zodResolver(crossPayReportFormSchema),
        defaultValues: {
            buyer_ids: undefined,
            factory_ids: undefined,
            cross_pay_from: undefined,
            cross_pay_to: undefined,
            factory_pay_from: undefined,
            factory_pay_to: undefined,
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