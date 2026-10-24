import clsx from "clsx";
import Link from "next/link";
import { useId } from "react";
import type { NotificationCardData } from "~/types/notification";
import { formatNotificationBody } from "~/utils/formatNotificationBody";
import { formatDateTime } from "~/utils/localDateString";
import IconButton from "../atoms/IconButton";
import RelativeTime from "../atoms/RelativeTime";
import UiIcon from "../atoms/UiIcon";

export const notificationStyles = {
    SUCCESS: "bg-secondary-accent",
    WARNING: "bg-warning",
    ERROR: "bg-red-accent",
    INFO: "bg-primary-accent",
};

type NotificationCardProps = {
    notification: NotificationCardData;
    recipientName?: string;
    isMarkingRead?: boolean;
    onMarkRead?: (id: string) => void;
    onDismiss?: (id: string) => void;
    onOpen?: () => void;
};

const NotificationCard = (props: NotificationCardProps) => {
    const { notification, recipientName, isMarkingRead = false, onMarkRead, onDismiss, onOpen } = props;

    const bodyId = useId();
    const { id, title, body, event_type, marked_at, added_at, slug } = notification;
    const isMarked = marked_at !== null;
    const href = slug ? `/${slug.replace(/^\/+/, "")}` : null;

    return (
        <article className={clsx("relative flex h-full flex-row gap-3 rounded-lg bg-white p-3 shadow-sm")}>
            <span className={clsx("w-1.5 shrink-0 self-stretch rounded-lg", notificationStyles[event_type])} />
            <div className="min-w-0 flex-1">
                {recipientName !== undefined && (
                    <div className="mb-2 flex items-start justify-between gap-3 border-b border-gray-100 pb-2 text-xs">
                        <span className="min-w-0 font-semibold text-gray-700">{recipientName}</span>
                        {added_at && (
                            <time dateTime={added_at.toISOString()} className="shrink-0 text-right text-gray-400">
                                {formatDateTime(added_at)}
                            </time>
                        )}
                    </div>
                )}
                <div className="flex items-start gap-2">
                    {href ? (
                        <Link
                            href={href}
                            aria-describedby={bodyId}
                            onClick={() => {
                                if (!isMarked) onMarkRead?.(id);
                                onOpen?.();
                            }}
                            className="focus-visible:outline-primary min-w-0 flex-1 rounded py-1 text-sm font-semibold leading-5 text-gray-900 after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:outline-2"
                        >
                            {title}
                        </Link>
                    ) : (
                        <h3 className="min-w-0 flex-1 py-1 text-sm font-semibold leading-5 text-gray-900">{title}</h3>
                    )}
                    {onDismiss && (
                        <IconButton label={`Dismiss ${title}`} onClick={() => onDismiss(id)} disabled={isMarkingRead} className="relative z-10 size-7">
                            <UiIcon name="close" />
                        </IconButton>
                    )}
                </div>
                <div id={bodyId} className="mt-1">
                    <div className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{formatNotificationBody(body)}</div>
                </div>
                <div className={clsx("mt-3 flex items-center gap-2 pr-3 text-xs", recipientName === undefined ? "justify-between" : "justify-end")}>
                    {recipientName === undefined && <RelativeTime date={added_at} />}
                    {isMarked ? (
                        <span className="text-gray-400">Read</span>
                    ) : onMarkRead ? (
                        <button
                            type="button"
                            onClick={() => onMarkRead(id)}
                            disabled={isMarkingRead}
                            className="text-primary focus-visible:outline-primary relative z-10 flex cursor-pointer items-center gap-1.5 rounded hover:underline focus-visible:outline-2 disabled:cursor-wait disabled:opacity-50"
                        >
                            <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                            Mark as read
                        </button>
                    ) : (
                        <span className="text-primary flex items-center gap-1.5">
                            <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                            Unread
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
};

export default NotificationCard;
