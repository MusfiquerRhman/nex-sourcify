"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Form, TableFooter, Wrapper } from "~/components";
import NotificationCard from "~/components/molecules/NotificationCard";
import { useDecodedUser } from "~/hooks/useDecodedUser";
import { api } from "~/trpc/react";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { notificationFilters, type NotificationFiltersValues } from "./config/formSchema";
import { useFormFields } from "./config/useFormFields";

const defaultFilters: NotificationFiltersValues = {
    db_id: "",
    module_id: 0,
    from_date: "",
    to_date: "",
    recipients_ids: [],
    level_id: 0,
    department_id: 0,
};

const Notifications = () => {
    const router = useRouter();
    const { isAdmin } = useDecodedUser();
    const [filters, setFilters] = useState<NotificationFiltersValues>(defaultFilters);
    const [page, setPage] = useState(1);
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<NotificationFiltersValues>({
        resolver: zodResolver(notificationFilters),
        defaultValues: defaultFilters,
    });
    const { fields, isLoading: isLoadingFilters, error: filterError, refetch: refetchFilters } = useFormFields();
    const { data, isPending, isError, isFetching, error, refetch } = api.notifications.getAll.useQuery({ filters, page });

    const currentPage = data?.page ?? page;
    const total = data?.total ?? 0;

    const applyFilters = handleSubmit((values) => {
        setFilters(values);
        setPage(1);
    });

    const resetFilters = () => {
        reset(defaultFilters);
        setFilters(defaultFilters);
        setPage(1);
    };

    return (
        <Wrapper
            heading="Notifications"
            subSectionRight={
                isAdmin && (
                    <Button
                        label="Send Notification"
                        variant="secondary"
                        className="max-w-56"
                        onClick={() => router.push("/maintenance/notifications/new")}
                    />
                )
            }
        >
            <Form
                fields={fields}
                onSubmit={applyFilters}
                buttonLabel="Apply Filters"
                secondaryActions={<Button label="Reset Filters" variant="secondary" className="max-w-40" onClick={resetFilters} />}
                register={register}
                control={control}
                validationError={errors}
                isLoading={isLoadingFilters}
                error={filterError ? parseTRPCError(filterError) : null}
            />
            {filterError && (
                <div className="flex justify-end px-8 pb-6">
                    <Button
                        label="Retry Filters"
                        className="max-w-40"
                        onClick={() => {
                            void refetchFilters();
                        }}
                    />
                </div>
            )}
            <div className="border-t border-gray-200 p-4" aria-busy={isFetching}>
                {isPending ? (
                    <p className="py-12 text-center text-sm text-gray-500" role="status">
                        Loading notifications...
                    </p>
                ) : isError ? (
                    <div className="py-12 text-center" role="alert">
                        <p className="text-sm text-red-600">{parseTRPCError(error)}</p>
                        <Button
                            label="Try Again"
                            className="mx-auto mt-4 max-w-40"
                            disabled={isFetching}
                            onClick={() => {
                                void refetch();
                            }}
                        />
                    </div>
                ) : total === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500" role="status">
                        No notifications match the selected filters.
                    </p>
                ) : (
                    <>
                        <ul aria-label="System notifications" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {data?.items.map((notification) => (
                                <li key={notification.id}>
                                    <NotificationCard
                                        notification={notification}
                                        recipientName={[notification.first_name, notification.last_name].filter(Boolean).join(" ")}
                                    />
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4">
                            <TableFooter
                                page={currentPage - 1}
                                limit={data?.pageSize ?? 50}
                                total={total}
                                prevPage={() => setPage(Math.max(1, currentPage - 1))}
                                nextPage={() => setPage(Math.min(data?.totalPages ?? 1, currentPage + 1))}
                            />
                        </div>
                    </>
                )}
            </div>
        </Wrapper>
    );
};

export default Notifications;
