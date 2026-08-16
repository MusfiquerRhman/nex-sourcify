import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExportReportFormSchema } from "./formSchema";
import type { ExportReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { useEffect } from "react";

const specialFields = [ "factory_ids", "brand_ids", "department_ids", "product_type_ids", "team_id" ] as const;

export const useExportReportForm = () => {
    const methods = useForm<ExportReportFormValues>({
        resolver: zodResolver(ExportReportFormSchema),
        defaultValues: {
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
            factory_ids: ['-2'],
            brand_ids: ['-2'],
            department_ids: ['-2'],
            product_type_ids: ['-2'],
            team_id: ['-2'],
            quantity: true,
            rdl_value: true,
            factory_value: true,
            commission_value: true,
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

            if (last === "-1") {
                normalized = ["-1"];
            } else if (last === "-2") {
                normalized = ["-2"];
            } else {
                normalized = value.filter(id => id !== "-1" && id !== "-2");
            }

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