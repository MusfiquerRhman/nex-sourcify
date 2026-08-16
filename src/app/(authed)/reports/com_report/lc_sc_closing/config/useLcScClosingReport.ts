import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LcScClosingReportFormSchema } from "./formSchema";
import type { LcScClosingReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

export const useLcScClosingReport = () => {
    const methods = useForm<LcScClosingReportFormValues>({
        resolver: zodResolver(LcScClosingReportFormSchema),
        defaultValues: {
            base: undefined,
            buyer_id: undefined,
            from_date: undefined,
            to_date: undefined,
            lcId: undefined
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const buyerId = useWatch({ control, name: "buyer_id" });
    const base = useWatch({ control, name: "base" });

    const { data: LCs } = api.lcScClosingReport.getLCs.useQuery(
        !!buyerId  ? {buyerId: Number(buyerId), base: base} : skipToken
    )

    const formFields = useFormFields({LCs: LCs ?? []});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}