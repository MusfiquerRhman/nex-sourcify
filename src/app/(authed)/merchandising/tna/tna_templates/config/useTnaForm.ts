import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetTNATemplateByIdTypes } from "~/types/merchandisingAPITypes";

type TNAActions = NonNullable<GetTNATemplateByIdTypes>['actions'][number];

export const useTnaForm = (tnaData?: GetTNATemplateByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: tnaData ? {
            db_id: tnaData.id ? tnaData.id.toString() : undefined,
            template_name: tnaData.template_name,
            buyer_id: tnaData.buyer_id?.toString() ?? "",
            team_id: tnaData.team_id?.toString() ?? "",
            actions: tnaData.actions?.map((action: TNAActions) => ({
                alert_before: action.alert_before,
                action_id: action.tna_action_id ? action.tna_action_id.toString() : undefined,
                days: action.days ?? undefined,
                db_id: action.id ? action.id.toString() : undefined,
            })) ?? [],
        } : {
            template_name: "",
            buyer_id: "",
            team_id: "",
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control } = methods;

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (tnaData) {
            methods.reset({
                ...tnaData,
                db_id: tnaData.id ? tnaData.id.toString() : undefined,
                buyer_id: tnaData.buyer_id ? tnaData.buyer_id.toString() : undefined,
                team_id: tnaData.team_id ? tnaData.team_id.toString() : undefined,
                actions: tnaData.actions?.map((action: TNAActions) => ({
                    ...action,
                    db_id: action.id ? action.id.toString() : undefined,
                    action_id: action.tna_action_id ? action.tna_action_id.toString() : undefined,
                    days: action.days ?? undefined,
                    // responsible_level_id: action.responsible_level_id ? action.responsible_level_id.toString() : undefined,
                })) ?? [],
            });
        }
    }, [tnaData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const buyer_id = methods.watch("buyer_id") ? parseInt(methods.watch("buyer_id")) : undefined;

    return { 
        methods, 
        handleSubmit, 
        formFields: formFields({ buyer_id }), 
        validationError, 
        control 
    };
};