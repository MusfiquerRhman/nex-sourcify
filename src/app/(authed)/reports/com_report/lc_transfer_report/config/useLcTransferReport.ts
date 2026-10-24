import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LcTransferReportFormSchema } from "./formSchema";
import type { LcTransferReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

export const useLcTransferReport = () => {
    const methods = useForm<LcTransferReportFormValues>({
        resolver: zodResolver(LcTransferReportFormSchema),
        defaultValues: {
            buyer_id: undefined,
            lcId: undefined,
            factoryId: undefined,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const buyerId = useWatch({ control, name: "buyer_id" });

    const { data: LCs } = api.lcTransferReport.getLCByBuyerId.useQuery(
        !!buyerId  ? {buyer_id: Number(buyerId)} : skipToken
    )

    const formFields = useFormFields({LCs: LCs ?? []});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}