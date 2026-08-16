import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { GetTNAPlanByIdTypes } from "~/types/merchandisingAPITypes";

type TNAActionsTypes =  NonNullable<GetTNAPlanByIdTypes>['actions'][number];

export const useTnaPlanningForm = (tnaData?: GetTNAPlanByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: tnaData ? {
            ...tnaData,
            tna_template_id: tnaData.template_id ? tnaData.template_id.toString() : undefined,
            buyer_order_id: tnaData.order_id ? tnaData.order_id.toString() : undefined,
            style_id: tnaData.style_id ? tnaData.style_id.toString() : undefined,
            plan_date: tnaData.plan_date ? formatDateForInput(new Date(tnaData.plan_date)) : formatDateForInput(new Date()),
            actions: tnaData.actions?.map((action: TNAActionsTypes) => ({
                ...action,
                action_name: action.action_name ? action.action_name.toString() : undefined,
                plan_date: action.plan_date ? formatDate(new Date(action.plan_date)) : undefined,
                revise_date: action.revise_date ? formatDateForInput(new Date(action.revise_date)) : undefined,
                actual_date: action.actual_date ? formatDate(new Date(action.actual_date)) : undefined,
                buyer_po: action.buyer_po ? action.buyer_po.toString() : undefined,
            })) ?? [],
        } : {
            tna_template_id: "",
            buyer_order_id: "",
            style_id: "",
            plan_date: formatDateForInput(new Date()),
            actions: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, setValue } = methods;

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (tnaData) {
            methods.reset({
                ...tnaData,
                tna_template_id: tnaData.template_id ? tnaData.template_id.toString() : undefined,
                buyer_order_id: tnaData.order_id ? tnaData.order_id.toString() : undefined,
                style_id: tnaData.style_id ? tnaData.style_id.toString() : undefined,
                plan_date: tnaData.plan_date ? formatDateForInput(new Date(tnaData.plan_date)) : formatDateForInput(new Date()),
                actions: tnaData.actions?.map((action: TNAActionsTypes) => ({
                    ...action,
                    action_name: action.action_name ? action.action_name.toString() : undefined,
                    plan_date: action.plan_date ? formatDate(new Date(action.plan_date)) : undefined,
                    revise_date: action.revise_date ? formatDateForInput(new Date(action.revise_date)) : undefined,
                    actual_date: action.actual_date ? formatDateForInput(new Date(action.actual_date)) : undefined,
                    buyer_po: action.buyer_po ? action.buyer_po.toString() : undefined,
                })) ?? [],
            });
        }
    }, [tnaData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const order_id = methods.watch("buyer_order_id");

    const { data: additionalData } = api.tnaPlan.getSeasonAndFactoryByOrderId.useQuery(
        !!order_id ? { order_id } : skipToken
    );

    setValue("season_name", additionalData?.season_name ?? '');

    setValue("factory_name", additionalData?.factory_name ?? '');

    setValue("buyer_name", additionalData?.buyer_name ?? '');

    setValue("brand_name", additionalData?.brand_name ?? '');

    setValue("department_name", additionalData?.department_name ?? '');

    const { data: orders } = api.tnaPlan.getOrdersForPlanning.useQuery();
    
    const { data: styles } = api.tnaPlan.getStyleForTNAPlanningByOrderId.useQuery(
        order_id ? { order_id } : skipToken
    );

    const { data: templates } = api.tnaTemplates.getAllTemplatesForPlanning.useQuery(
        order_id ? { order_id } : skipToken
    );

    let availableOrders = [];
    let availableStyles = [];
    let availableTemplates = [];

    if(tnaData?.order_id && tnaData?.ref_no) {
        availableOrders = [{ id: tnaData.order_id, ref_no: tnaData.ref_no }];
    }
    else {
        availableOrders = orders ?? [];
    }

    if(tnaData?.style_id && tnaData?.style) {
        availableStyles = [{ id: tnaData.style_id, style: tnaData.style }];
    }
    else {
        availableStyles = styles ?? [];
    }

    if(tnaData?.template_id && tnaData?.template_name) {
        availableTemplates = [{ id: tnaData.template_id, template_name: tnaData.template_name }];
    }
    else {
        availableTemplates = templates ?? [];
    }

    const isEdit = !!tnaData;

    return { 
        methods, 
        handleSubmit,
        formFields: formFields({ 
            orders: availableOrders, 
            styles: availableStyles, 
            templates: availableTemplates,
            isEdit: isEdit,
        }),
        validationError, 
        control 
    };
}