type NotificationPaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    isBusy: boolean;
    hasError: boolean;
    isMarkAllReadDisabled: boolean;
    onPageChange: (page: number) => void;
    onMarkAllRead: () => void;
};

export default function NotificationPagination(props: NotificationPaginationProps) {
    const { page, pageSize, total, totalPages, isBusy, hasError, isMarkAllReadDisabled, onPageChange, onMarkAllRead } = props;

    const showPagination = !hasError && total > 0;
    const firstItem = (page - 1) * pageSize + 1;
    const lastItem = Math.min(page * pageSize, total);

    // prettier-ignore
    const buttonClassName = `focus-visible:outline-primary cursor-pointer rounded-lg px-2 py-1.5 text-sm 
        text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-2 disabled:cursor-default 
        disabled:text-gray-300 disabled:hover:bg-transparent`;

    return (
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <p className="text-xs text-gray-500">{showPagination && `${firstItem}–${lastItem} of ${total}`}</p>
                {showPagination ? (
                    <nav aria-label="Notification pagination" className="flex items-center justify-center gap-1">
                        <button
                            type="button"
                            aria-label="Previous notification page"
                            disabled={isBusy || page <= 1}
                            onClick={() => onPageChange(page - 1)}
                            className={buttonClassName}
                        >
                            Previous
                        </button>
                        <span className="px-1 text-xs whitespace-nowrap text-gray-500" role="status">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            aria-label="Next notification page"
                            disabled={isBusy || page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                            className={buttonClassName}
                        >
                            Next
                        </button>
                    </nav>
                ) : (
                    <div />
                )}
                <div className="flex justify-end">
                    <button
                        type="button"
                        aria-label="Mark all as read"
                        title="Mark all as read"
                        onClick={onMarkAllRead}
                        disabled={isMarkAllReadDisabled}
                        className="bg-secondary hover:bg-secondary-accent focus-visible:outline-secondary flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none min-[400px]:size-9"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6" aria-hidden="true">
                            <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
