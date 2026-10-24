import type { Notification } from "~/types/notification";
import NotificationCard from "./NotificationCard";

type NotificationListProps = {
    notifications: Notification[];
    isLoading: boolean;
    hasError: boolean;
    isRefreshing: boolean;
    isMarkingRead: boolean;
    onRetry: () => void;
    onMarkRead: (id: string) => void;
    onDismiss: (id: string) => void;
    onOpen: () => void;
};

const NotificationList = (props: NotificationListProps) => {
    const { notifications, isLoading, hasError, isRefreshing, isMarkingRead, onRetry, onMarkRead, onDismiss, onOpen } = props;

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center px-6 py-16 text-sm text-gray-500" role="status">
                Loading notifications...
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center" role="alert">
                <p className="font-medium text-gray-900">Unable to load notifications</p>
                <button
                    type="button"
                    onClick={onRetry}
                    disabled={isRefreshing}
                    className="text-primary focus-visible:outline-primary mt-3 cursor-pointer rounded text-sm hover:underline focus-visible:outline-2 disabled:cursor-wait disabled:opacity-50"
                >
                    {isRefreshing ? "Retrying..." : "Try again"}
                </button>
            </div>
        );
    }

    if (!notifications.length) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center" role="status">
                <p className="font-medium text-gray-900">No notifications here</p>
                <p className="mt-2 text-sm text-gray-500">Check back later.</p>
            </div>
        );
    }

    return (
        <ul aria-label="Notifications" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-3 pb-4">
            {notifications.map((notification) => (
                <li key={notification.id}>
                    <NotificationCard notification={notification} isMarkingRead={isMarkingRead} onMarkRead={onMarkRead} onDismiss={onDismiss} onOpen={onOpen} />
                </li>
            ))}
        </ul>
    );
};

export default NotificationList;
