import IconButton from "../atoms/IconButton";
import UiIcon from "../atoms/UiIcon";

type NotificationPanelHeaderProps = {
    unreadCount: number;
    isLoading: boolean;
    hasError: boolean;
    onClose: () => void;
};

export default function NotificationPanelHeader(props: NotificationPanelHeaderProps) {
    const { unreadCount, isLoading, hasError, onClose } = props;

    return (
        <div className="flex items-start justify-between gap-3">
            <div>
                <h2 id="notification-panel-title" className="text-xl font-semibold text-gray-900">
                    Notification Center
                </h2>
                <p className="mt-1 text-sm text-gray-500" role="status">
                    {isLoading
                        ? "Loading notifications..."
                        : hasError
                          ? "Notifications are unavailable"
                          : unreadCount
                            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                            : "You're all caught up"}
                </p>
            </div>
            <IconButton label="Close notifications" onClick={onClose}>
                <UiIcon name="close" className="size-6" />
            </IconButton>
        </div>
    );
}
