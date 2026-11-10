import { skipToken } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { api, type RouterOutputs } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import { sampleChecklistStatusOptions } from "~/utils/sampleChecklist";
import { formatDateForInput } from "~/utils/localDateString";
import { sampleChecklistFormSchema, type SampleChecklistFormValues } from "./formSchema";

export type SampleChecklist = RouterOutputs["sampleChecklist"]["getSampleChecklistById"];

type SampleChecklistHeaderSource = RouterOutputs["sampleChecklist"]["getResubmissionReferences"][number];

export const getSampleChecklistHeader = (source?: SampleChecklistHeaderSource) => ({
    with_order: source?.with_order ?? (source ? !!source.style_id : true),
    sample_check_date: source?.sample_check_date ? source.sample_check_date.toISOString().slice(0, 10) : formatDateForInput(new Date()),
    buyer_id: source?.buyer_id ?? 0,
    factory_id: source?.factory_id ?? 0,
    order_id: source?.order_styles?.order_id ?? "",
    style_id: source?.style_id ?? "",
    style_no_manual: source?.style_no_manual ?? "",
    color_id: source?.color_id ?? 0,
    sample_type: source?.sample_type ?? 0,
    status: sampleChecklistStatusOptions.find((option) => option.value === source?.status)?.value,
    sample_size: source?.sample_size ?? "",
    sample_quantity: source?.sample_quantity ?? Number.NaN,
});

const getLabelStatus = (value: number | null | undefined) => {
    return value === 1 ? 1 : value === -1 ? -1 : value === -2 ? -2 : 0;
};

export const useSampleChecklistForm = (checklist: SampleChecklist | undefined, isFirstSubmission: boolean) => {
    const methods = useForm<SampleChecklistFormValues>({
        resolver: zodResolver(sampleChecklistFormSchema),
        defaultValues: {
            ...getSampleChecklistHeader(checklist),
            fabric: checklist?.fabric ?? "",
            trims_accessories: checklist?.trims_accessories ?? "",
            workmanship: checklist?.workmanship ?? "",
            fitting: checklist?.fitting ?? "",
            measurement: checklist?.measurement ?? "",
            pattern: checklist?.pattern ?? "",
            print_emb: checklist?.print_emb ?? "",
            wash: checklist?.wash ?? "",
            main_label: getLabelStatus(checklist?.main_label),
            main_label_position: getLabelStatus(checklist?.main_label_position),
            size_label: getLabelStatus(checklist?.size_label),
            size_label_position: getLabelStatus(checklist?.size_label_position),
            care_label: getLabelStatus(checklist?.care_label),
            care_label_position: getLabelStatus(checklist?.care_label_position),
            risk_area: checklist?.risk_area ?? "",
        },
    });

    const { control, getValues, setValue } = methods;
    const [withOrder, buyerId, factoryId, styleId] = useWatch({ control, name: ["with_order", "buyer_id", "factory_id", "style_id"] });
    const canChangeStyle = !checklist || withOrder !== checklist.with_order;
    const buyersQuery = api.buyers.getAll.useQuery();
    const factoriesQuery = api.factory.getAllFactories.useQuery();
    const sampleTypesQuery = api.sampleTypes.getAllSampleType.useQuery(undefined, { enabled: !withOrder });
    const stylesQuery = api.sampleChecklist.getStyles.useQuery(withOrder && buyerId && factoryId ? { buyerId, factoryId, availableOnly: isFirstSubmission } : skipToken);
    const selectedStyle = withOrder ? stylesQuery.data?.find((style) => style.id === styleId) : undefined;
    const optionsQuery = api.sampleChecklist.getStyleOptions.useQuery(selectedStyle ? { styleId: selectedStyle.id, availableOnly: isFirstSubmission } : skipToken);
    const manualOptionsQuery = api.sampleChecklist.getManualOptions.useQuery(!withOrder && buyerId ? { buyerId } : skipToken);
    const activeOptionsQuery = withOrder ? optionsQuery : manualOptionsQuery;

    const sampleTypes = withOrder ? optionsQuery.data?.sampleTypes : sampleTypesQuery.data;
    const queryError = buyersQuery.error ?? factoriesQuery.error ?? (withOrder ? stylesQuery.error ?? optionsQuery.error : sampleTypesQuery.error ?? manualOptionsQuery.error);
    const isLoadingOptions = buyersQuery.isFetching ||
        factoriesQuery.isFetching ||
        (!withOrder && sampleTypesQuery.isFetching) ||
        (withOrder && stylesQuery.isFetching) || activeOptionsQuery.isFetching;

    const headerFields: BaseField<keyof SampleChecklistFormValues>[] = [
        { name: "sample_check_date", label: "Date", type: "date" },
        {
            name: "buyer_id",
            label: "Buyer",
            type: "select",
            options: buyersQuery.data?.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: buyersQuery.isFetching,
        },
        {
            name: "factory_id",
            label: "Factory",
            type: "select",
            options: factoriesQuery.data?.map((factory) => ({ label: factory.name, value: factory.id })),
            disabled: factoriesQuery.isFetching,
        },
        {
            name: "with_order",
            label: "With Order",
            type: "select",
            options: [{ label: "With Order", value: true }, { label: "Without Order", value: false }],
        },
        withOrder ? {
            name: "style_id",
            label: "Style",
            type: "select",
            options: !canChangeStyle && checklist?.style_id && checklist.order_styles
                ? [{ label: `${checklist.order_styles.style} (${checklist.order_styles.buyer_orders.ref_no})`, value: checklist.style_id }]
                : stylesQuery.data?.map((style) => ({ label: `${style.style} (${style.buyer_orders.ref_no})`, value: style.id })),
            disabled: !buyerId || !factoryId || stylesQuery.isFetching,
        } : { name: "style_no_manual", label: "Style", type: "text" },
        {
            name: "order_id",
            label: "Order Reference",
            type: "select",
            optional: true,
            options: !canChangeStyle && checklist?.order_styles
                ? [{ label: checklist.order_styles.buyer_orders.ref_no, value: checklist.order_id }]
                : withOrder && selectedStyle ? [{ label: selectedStyle.buyer_orders.ref_no, value: selectedStyle.order_id }] : [],
            disabled: true,
        },
        {
            name: "color_id",
            label: "Color",
            type: "select",
            options: checklist
                ? [{ label: checklist.colors.name, value: checklist.color_id }]
                : activeOptionsQuery.data?.colors.map((color) => ({ label: color.name, value: color.id })),
            disabled: (withOrder ? !selectedStyle : !buyerId) || activeOptionsQuery.isFetching,
        },
        {
            name: "sample_type",
            label: "Sample Type",
            type: "select",
            options: checklist
                ? [{ label: checklist.sample_types.name, value: checklist.sample_type }]
                : sampleTypes?.map((sampleType) => ({ label: sampleType.name, value: sampleType.id })),
            disabled: withOrder ? !selectedStyle || optionsQuery.isFetching : sampleTypesQuery.isFetching,
        },
        {
            name: "sample_size",
            label: "Sample Size",
            type: "select",
            options: checklist?.sample_size
                ? [{ label: checklist.sample_size, value: checklist.sample_size }]
                : activeOptionsQuery.data?.sizes.map((size) => ({ label: size, value: size })),
            disabled: (withOrder ? !selectedStyle : !buyerId) || activeOptionsQuery.isFetching,
        },
        { name: "sample_quantity", label: "Sample Quantity", type: "number" },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [...sampleChecklistStatusOptions],
        },
    ];

    const resetDependentFields = (name: keyof SampleChecklistFormValues) => {
        if (name === "with_order" && checklist) {
            const restoreStyle = getValues("with_order") === checklist.with_order;
            setValue("order_id", restoreStyle ? checklist.order_id : "", { shouldDirty: true });
            setValue("style_id", restoreStyle ? checklist.style_id ?? "" : "", { shouldDirty: true });
            setValue("style_no_manual", restoreStyle ? checklist.style_no_manual ?? "" : "", { shouldDirty: true });
            return;
        }
        if (name === "buyer_id" || name === "factory_id" || name === "with_order") {
            setValue("order_id", "", { shouldDirty: true });
            setValue("style_id", "", { shouldDirty: true });
        }
        if (name === "buyer_id" || name === "with_order") setValue("style_no_manual", "", { shouldDirty: true });
        if (name === "style_id") {
            const style = stylesQuery.data?.find((style) => style.id === getValues("style_id"));
            setValue("order_id", style?.order_id ?? "", { shouldDirty: true, shouldValidate: true });
        }
        if (!checklist && (name === "buyer_id" || name === "factory_id" || name === "style_id" || name === "with_order")) {
            setValue("sample_type", 0, { shouldDirty: true });
            setValue("color_id", 0, { shouldDirty: true });
            setValue("sample_size", "", { shouldDirty: true });
        }
    };

    return { methods, headerFields, resetDependentFields, queryError, isLoadingOptions, selectedStyle, canChangeStyle, sampleTypes };
};
