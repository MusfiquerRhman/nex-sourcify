import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExportSummaryReportFormSchema } from "./formSchema";
import type { ExportSummaryReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

export const useExportSummaryReport = () => {
    const methods = useForm<ExportSummaryReportFormValues>({
        resolver: zodResolver(ExportSummaryReportFormSchema),
        defaultValues: {
            base: 'SC',
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
            lcIds: undefined
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const buyerIds = useWatch({ control, name: "buyer_ids" });
    const base = useWatch({ control, name: "base" });

    const { data: LCs } = api.exportSummaryReport.getLCs.useQuery(
        (buyerIds ?? []).length > 0 ? {buyerIds: buyerIds, base: base} : skipToken
    )

    const formFields = useFormFields({LCs: LCs ?? []});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}