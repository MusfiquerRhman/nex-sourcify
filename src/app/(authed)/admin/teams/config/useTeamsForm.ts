import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetTeamByIdTypes } from "~/types/adminAPITypes";

export const useTeamsForm = (teamData?: GetTeamByIdTypes['team']) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: teamData ? {
            team_name: teamData.team_name ?? "",
            buyer_id: teamData.buyer_id?.toString() ?? undefined,
        } : {
            team_name: "",
            buyer_id: undefined,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, control } = methods;

    // Effect to reset form when teamData changes
    useEffect(() => {
        if (teamData) {
            methods.reset({
                team_name: teamData.team_name ?? "",
                buyer_id: teamData.buyer_id?.toString() ?? undefined,
            });
        }   
    }, [teamData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    return { methods, handleSubmit, formFields: formFields(), validationError, trigger, control };
}