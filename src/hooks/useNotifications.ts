"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import NotificationToast from "~/components/molecules/NotificationToast";
import { api } from "~/trpc/react";
import type { NotificationFilter } from "~/types/notification";
import { parseTRPCError } from "~/utils/parseTRPCError";

export default function useNotifications(open = false) {
    const [filter, setFilter] = useState<NotificationFilter>("unread");
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const seenNotificationIds = useRef<Set<string> | null>(null);
    const utils = api.useUtils();
    const { data: latestData } = api.notifications.list.useQuery(
        { page: 1, filter: "all", moduleId: null, dismissedIds: [] },
        {
            refetchInterval: 30_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
        },
    );
    const { data, isPending, isError, isFetching, refetch } = api.notifications.list.useQuery(
        { page, filter, moduleId: selectedModuleId, dismissedIds },
        {
            enabled: open,
            staleTime: 0,
            refetchInterval: open ? 30_000 : false,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
        },
    );

    useEffect(() => {
        if (!latestData) return;

        if (seenNotificationIds.current === null) {
            seenNotificationIds.current = new Set(latestData.items.map((notification) => notification.id));
            return;
        }

        for (const notification of latestData.items) {
            if (seenNotificationIds.current.has(notification.id)) continue;
            seenNotificationIds.current.add(notification.id);

            if (notification.marked_at !== null || notification.is_marked === true) continue;

            toast.custom((toastId) => createElement(NotificationToast, { notification, toastId }), {
                id: `notification-${notification.id}`,
                className: "notification-toast",
                duration: 6000,
            });
        }
    }, [latestData]);

    useEffect(() => {
        if (data && data.page !== page) setPage(data.page);
    }, [data, page]);

    useEffect(() => {
        if (selectedModuleId === null || !latestData || latestData.modules.some((module) => module.id === selectedModuleId)) return;

        setSelectedModuleId(null);
        setPage(1);
    }, [latestData, selectedModuleId]);

    const markReadMutation = api.notifications.markRead.useMutation({
        onSuccess: () => utils.notifications.list.invalidate(),
        onError: (error) => toast.error(`Could not mark notification as read: ${parseTRPCError(error)}`),
    });

    const markAllReadMutation = api.notifications.markAllRead.useMutation({
        onSuccess: () => utils.notifications.list.invalidate(),
        onError: (error) => toast.error(`Could not mark all notifications as read: ${parseTRPCError(error)}`),
    });

    const isMarkingRead = markReadMutation.isPending || markAllReadMutation.isPending;
    const notifications = (data?.items ?? []).filter((notification) => !dismissedIds.includes(notification.id));
    const unreadCount = latestData?.unreadCount ?? data?.unreadCount ?? 0;
    const counts = data?.counts ?? { all: 0, unread: 0, system: 0 };
    const modules = latestData?.modules ?? data?.modules ?? [];

    const changeFilter = (nextFilter: NotificationFilter) => {
        setFilter(nextFilter);
        setPage(1);
    };

    const changeModule = (moduleId: number | null) => {
        setSelectedModuleId(moduleId);
        setPage(1);
    };

    const markRead = (id?: string) => {
        if (isMarkingRead) return;
        if (id !== undefined) {
            markReadMutation.mutate({ id });
        } else {
            markAllReadMutation.mutate();
        }
    };

    const dismiss = (id: string) => {
        if (isMarkingRead) return;

        const hide = () => setDismissedIds((current) => [...current, id]);

        if (notifications.some((notification) => notification.id === id && notification.marked_at === null)) {
            markReadMutation.mutate({ id }, { onSuccess: hide });
        } else {
            hide();
        }
    };

    return {
        filter,
        setFilter: changeFilter,
        selectedModuleId,
        setSelectedModuleId: changeModule,
        modules,
        page: data?.page ?? page,
        pageSize: data?.pageSize ?? latestData?.pageSize ?? 0,
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 1,
        setPage,
        counts,
        unreadCount,
        visibleNotifications: notifications,
        markRead,
        dismiss,
        isLoading: isPending,
        hasError: isError,
        isRefreshing: isFetching,
        isMarkingRead,
        refresh: () => {
            void refetch();
        },
    };
}
