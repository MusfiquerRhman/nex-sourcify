import type { notifications, notification_types, users } from "@prisma/client";

export type Notification = notifications;
export type NotificationCardData = Pick<Notification, "id" | "title" | "body" | "slug" | "event_type" | "is_marked" | "marked_at" | "added_at">;
export type NotificationAuditItem = NotificationCardData & Pick<users, "first_name" | "last_name">;
export type NotificationType = notification_types;
export type NotificationFilter = "all" | "unread" | "system";

export type NotificationModuleOption = {
    id: number;
    name: string;
};
