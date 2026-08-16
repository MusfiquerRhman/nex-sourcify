'use client';

import { Button, Form, Wrapper } from "~/components";
import { useTnaEventsForm } from "./config/useTnaEventsForm";
import { useEffect, useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import type { FormValues } from "./config/formSchema";
import TableForm from "~/components/organisms/table/TableForm";
import { tableHeaders } from "./config/columns";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useFormFields } from "./config/useTableFormFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const TNAEventsPage = () => {
    const { methods, formFields, validationError, control } = useTnaEventsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const utils = api.useUtils();

    const { fields: actionFields } = useFieldArray<FormValues>({
        control: methods.control,
        name: "actions",
    });

    const fromDate = useWatch({ control: methods.control, name: "from_date" });
    const toDate = useWatch({ control: methods.control, name: "to_date" });
    const actionsId = useWatch({ control: methods.control, name: "event_ids" });
    const actionIds = actionsId ?? [];

    const { data: events} = api.tnaPlan.getEventsForTnaUpdate.useQuery(
        (!!fromDate && !!toDate && actionIds.length > 0) ? {
            from_date: fromDate,
            to_date: toDate,
            actionIds,
        } : skipToken,
    );

    useEffect(() => {
        methods.reset({
            ...methods.getValues(),
            actions: events?.map((event: typeof events[number]) => ({
                id: event.id,
                action_name: event.action_name,
                order_ref: event.order_ref,
                style: event.style,
                po: event.po,
                template_name: event.tna_templates,
                plan_date: event.plan_date
                    ? formatDate(new Date(event.plan_date))
                    : '',
                revise_date: event.revise_date?.toISOString(),
                actual_date: formatDateForInput(new Date()),
                buyer_name: event.buyer_name,
                factory_name: event.factory_name,
                destination_name: event.destination_name,
            })) ?? [],
        });
    }, [events, methods]);

    const updateMutation = api.tnaPlan.updateTnaEvents.useMutation({
        onSuccess: async () => {
            setError(null);
            setIsLoading(false);
            await utils.tnaPlan.getEventsForTnaUpdate.invalidate();
            toast.success("TNA Events updated successfully!");
        }
    });

    const onSubmit = methods.handleSubmit(async (data) => {
        try {
            setIsLoading(true);

            const payload = data.actions.filter((action) => action.checked).map((action) => ({
                id: action.id,
                revise_date: action.revise_date ? new Date(action.revise_date) : undefined,
                actual_date: action.actual_date ? new Date(action.actual_date) : undefined,
            }));
            
            await updateMutation.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating TNA Plan: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper
            heading="Update TNA Events"
        >
            <Form
                fields={formFields} 
                buttonLabel="Update TNA Events" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <TableForm 
                name='actions'
                title={"Pending TNA Events"}
                fields={useFormFields()}
                rows={actionFields}
                columns={tableHeaders}
                register={methods.register}
                disabled={isLoading}
                control={methods.control}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmit()}
                    label={"Update TNA Events"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default TNAEventsPage;