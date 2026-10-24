'use client';

import { Button, Form, Info, SearchField, Wrapper } from "~/components";
import { useTnaEventsForm } from "./config/useTnaEventsForm";
import { useEffect, useMemo, useState } from "react";
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
import { useSearchablePagination } from "~/hooks";

const TNAEventsPage = () => {
    const { methods, formFields, validationError, control } = useTnaEventsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { debouncedSearch, handleSearchChange } = useSearchablePagination();

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

    // Search query (enabled only when there's a search term)
    const {data: searchQuery, isLoading: isSearchLoading} = api.tnaPlan.searchTnaPlansForEventUpdate.useQuery(
        { search_term: debouncedSearch },
        { enabled: debouncedSearch.length > 0 }
    );

    const tableEvents = useMemo(() => {
        if (debouncedSearch.trim().length > 0) {
            return searchQuery?.events ?? [];
        }

        return events?.events ?? [];
    }, [debouncedSearch, events, searchQuery]);

    const mappedTableEvents = useMemo(
        () => tableEvents.map((event: typeof tableEvents[number]) => ({
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
        })),
        [tableEvents],
    );

    const { setValue } = methods;

    useEffect(() => {
        setValue('actions', mappedTableEvents, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
        });
    }, [mappedTableEvents, setValue]);

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
                isLoading={isLoading || isSearchLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <div className="flex flex-col ml-8 mb-4">
                <SearchField
                    placeholder="Search Pending TNA Events..."
                    infoText="Search Order References, Style, PO, Buyer Name and Factory Name"
                    handleSearchChange={handleSearchChange}
                />
            </div>

            <TableForm 
                name='actions'
                title={"Pending TNA Events"}
                fields={useFormFields()}
                rows={actionFields}
                columns={tableHeaders}
                register={methods.register}
                disabled={isLoading || isSearchLoading}
                control={methods.control}
            />

            
            {actionFields.length > 0 && 
                <Info variant='info'
                    className="items-center w-full text-center"
                    info={`Showing ${actionFields.length} / ${searchQuery && searchQuery?.total > 0 ? searchQuery?.total ?? 0 : events?.total} Rows`} 
                />
            }

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmit()}
                    label={"Update TNA Events"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isSearchLoading}
                />
            </div>
        </Wrapper>
    );
}

export default TNAEventsPage;