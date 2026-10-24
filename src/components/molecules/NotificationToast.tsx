"use client";

import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { Notification } from "~/types/notification";
import { parseTRPCError } from "~/utils/parseTRPCError";
import NotificationCard from "./NotificationCard";

type NotificationToastProps = {
    notification: Notification;
    toastId: string | number;
};

export default function NotificationToast(props: NotificationToastProps) {
    const { notification, toastId } = props;

    const utils = api.useUtils();
    const close = () => toast.dismiss(toastId);
    const markReadMutation = api.notifications.markRead.useMutation({
        onSuccess: () => {
            close();
            return utils.notifications.list.invalidate();
        },
        onError: (error) => toast.error(`Could not mark notification as read: ${parseTRPCError(error)}`),
    });

    const markRead = (id: string) => {
        if (markReadMutation.isPending) return;
        markReadMutation.mutate({ id });
    };

    return <NotificationCard notification={notification} isMarkingRead={markReadMutation.isPending} onMarkRead={markRead} onDismiss={close} onOpen={close} />;
}
