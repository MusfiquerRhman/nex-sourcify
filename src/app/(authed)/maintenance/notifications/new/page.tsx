"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { notification_types } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, FormSelect, Info, Label, TextField, Wrapper } from "~/components";
import { notificationStyles } from "~/components/molecules/NotificationCard";
import { api } from "~/trpc/react";
import { formatNotificationBody } from "~/utils/formatNotificationBody";
import { parseTRPCError } from "~/utils/parseTRPCError";
import NotificationDescriptionEditor from "../components/NotificationDescriptionEditor";
import { notificationFormSchema, type NotificationFormValues } from "../config/formSchema";

const getLabel = (type: notification_types) => {
    if(type === 'INFO') return 'General';
    else if (type === 'SUCCESS') return 'Positive';
    else if (type === 'WARNING') return 'Warning';
    else return 'Negative'
}

const NewNotificationPage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    const levels = api.levels.getLevels.useQuery();
    const departments = api.departments.getDepartments.useQuery();
    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationFormSchema),
        defaultValues: {
            title: "",
            description: "",
            level_id: 0,
            department_id: 0,
            event_type: notification_types.INFO,
        },
    });
    const addNotification = api.notifications.addNotification.useMutation({
        onSuccess: (result) => {
            toast.success(`Notification sent to ${result.count} ${result.count === 1 ? "user" : "users"}.`);
            void utils.notifications.getAll.invalidate();
            void utils.notifications.list.invalidate();
            router.push("/maintenance/notifications");
        },
        onError: (error) => toast.error(`Could not send notification: ${parseTRPCError(error)}`),
    });

    const title = watch("title");
    const description = watch("description");
    const eventType = watch("event_type");
    const optionsError = levels.error ?? departments.error;
    const isLoadingOptions = levels.isPending || departments.isPending;
    const isSending = isSubmitting || addNotification.isPending;

    const onSubmit = handleSubmit(async (values) => {
        if (isSending || isLoadingOptions || optionsError) return;

        await addNotification.mutateAsync(values).catch(() => undefined);
    });

    return (
        <Wrapper heading="Send Notification">
            <form onSubmit={onSubmit} className="flex w-full flex-col gap-6 p-8" aria-busy={isSending}>
                {optionsError && (
                    <div role="alert" className="rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
                        <p>Could not load recipient options: {parseTRPCError(optionsError)}</p>
                        <Button
                            label="Retry"
                            className="mt-3 max-w-40"
                            disabled={isLoadingOptions}
                            onClick={() => {
                                void levels.refetch();
                                void departments.refetch();
                            }}
                        />
                    </div>
                )}
                {isLoadingOptions && <p role="status">Loading recipient options...</p>}
                {addNotification.error && (
                    <p role="alert" className="text-red-600">
                        {parseTRPCError(addNotification.error)}
                    </p>
                )}
                <fieldset disabled={isSending} className="flex min-w-0 flex-col gap-4">
                    <TextField {...register("title")} label="Title" placeholder="Enter a notification title" maxLength={70} error={errors.title?.message} />
                    <div className="flex flex-col">
                        <Label label="Description" htmlFor="description" isErrored={!!errors.description} />
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <NotificationDescriptionEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    disabled={isSending}
                                    error={!!errors.description}
                                />
                            )}
                        />
                        <p id="description-help" className="text-sm text-gray-600">
                            Select text to apply bold, italic, or underline, or use the bullet list button to add a list.
                        </p>
                        <div id="description-error">
                            <Info info={errors.description?.message} variant="error" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Controller
                            name="level_id"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    label="Level"
                                    name={field.name}
                                    value={field.value ?? 0}
                                    onChange={field.onChange}
                                    options={[
                                        { label: "All levels", value: 0 },
                                        ...(levels.data?.map((level) => ({ label: level.name, value: level.id })) ?? []),
                                    ]}
                                    error={errors.level_id?.message}
                                    disabled={isSending || isLoadingOptions || !!optionsError}
                                    optional
                                />
                            )}
                        />
                        <Controller
                            name="department_id"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    label="Department"
                                    name={field.name}
                                    value={field.value ?? 0}
                                    onChange={field.onChange}
                                    options={[
                                        { label: "All departments", value: 0 },
                                        ...(departments.data?.map((department) => ({ label: department.name, value: department.id })) ?? []),
                                    ]}
                                    error={errors.department_id?.message}
                                    disabled={isSending || isLoadingOptions || !!optionsError}
                                    optional
                                />
                            )}
                        />
                        <Controller
                            name="event_type"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    label="Notification Type"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={Object.values(notification_types).map((type) => ({ label: getLabel(type), value: type }))}
                                    error={errors.event_type?.message}
                                    disabled={isSending}
                                />
                            )}
                        />
                    </div>
                    <p className="text-sm text-gray-600">The notification will be sent to all users matching the selected level and department.</p>
                    {(title.trim() || description.trim()) && (
                        <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm max-w-[500px]">
                            <span aria-hidden="true" className={`w-1.5 shrink-0 self-stretch rounded-lg ${notificationStyles[eventType]}`} />
                            <div className="min-w-0 flex-1">
                                <p className="mb-2 text-sm font-semibold">{title}</p>
                                <div className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{formatNotificationBody(description)}</div>
                                <p className="mt-3 text-xs text-gray-400">Just now</p>
                            </div>
                        </div>
                    )}
                </fieldset>
                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                    <Button
                        label="Cancel"
                        variant="secondary"
                        className="sm:max-w-40"
                        disabled={isSending}
                        onClick={() => router.push("/maintenance/notifications")}
                    />
                    <Button
                        type="submit"
                        label={isSending ? "Sending..." : "Send Notification"}
                        className="sm:max-w-56"
                        disabled={isSending || isLoadingOptions || !!optionsError}
                    />
                </div>
            </form>
        </Wrapper>
    );
};

export default NewNotificationPage;
