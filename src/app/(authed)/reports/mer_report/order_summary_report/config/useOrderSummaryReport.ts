import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSummaryReportFormSchema } from "./formSchema";
import type { OrderSummaryReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { useEffect } from "react";

const specialFields = [ "factory_ids", "brand_ids", "department_ids", "season_ids", "team_id" ] as const;

export const useOrderSummaryReport = () => {
    const methods = useForm<OrderSummaryReportFormValues>({
        resolver: zodResolver(OrderSummaryReportFormSchema),
        defaultValues: {
            base: 'EXFACTORY',
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
            factory_ids: ['-1'],
            brand_ids: ['-1'],
            department_ids: ['-1'],
            season_ids: ['-1'],
            team_id: ['-1'],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const buyer_ids = useWatch({ control, name: "buyer_ids" });

    const brand_ids = useWatch({ control, name: "brand_ids" });

    const watchedValues = useWatch({ control, name: specialFields });

    useEffect(() => {
        specialFields.forEach((field, index) => {
            const value = watchedValues[index];

            if (!Array.isArray(value)) return;

            const last = value[value.length - 1];

            let normalized = value;

            last === "-1" ? normalized = ["-1"] : normalized = value.filter(id => id !== "-1");

            if (JSON.stringify(normalized) !== JSON.stringify(value)) {
                methods.setValue(field, normalized);
            }
        });
    }, [watchedValues, methods]);

    const formFields = useFormFields({
        buyer_ids: buyer_ids?.map(id => Number(id)), 
        brand_ids: brand_ids?.map(id => Number(id))
    });

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}