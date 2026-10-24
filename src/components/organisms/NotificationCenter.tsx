"use client";

import { useCallback, useState } from "react";
import useNotifications from "~/hooks/useNotifications";
import NotificationFilters from "../molecules/NotificationFilters";
import NotificationList from "../molecules/NotificationList";
import NotificationPagination from "../molecules/NotificationPagination";
import NotificationPanelHeader from "../molecules/NotificationPanelHeader";
import NotificationTrigger from "../molecules/NotificationTrigger";
import SidePanel from "../molecules/SidePanel";

export default function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    // prettier-ignore
    const {
        filter, setFilter, selectedModuleId, setSelectedModuleId, modules, counts, unreadCount, visibleNotifications, markRead, dismiss,
        page, pageSize, total, totalPages, setPage, isLoading, hasError, isRefreshing, isMarkingRead, refresh,
    } = useNotifications(open);

    return (
        <>
            <NotificationTrigger open={open} unreadCount={unreadCount} onClick={() => setOpen((value) => !value)} />
            <SidePanel open={open} id="notification-panel" labelledBy="notification-panel-title" closeLabel="Close notifications" onClose={close}>
                <div className="shrink-0 space-y-3 border-b border-gray-200 bg-white px-4 pt-6 pb-4">
                    <NotificationPanelHeader unreadCount={unreadCount} isLoading={isLoading} hasError={hasError} onClose={close} />
                    <NotificationFilters
                        selected={filter}
                        selectedModuleId={selectedModuleId}
                        modules={modules}
                        counts={counts}
                        onChange={setFilter}
                        onModuleChange={setSelectedModuleId}
                    />
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col">
                    <NotificationList
                        key={`${filter}-${selectedModuleId ?? "all"}-${page}`}
                        notifications={visibleNotifications}
                        isLoading={isLoading}
                        hasError={hasError}
                        isRefreshing={isRefreshing}
                        isMarkingRead={isMarkingRead}
                        onRetry={refresh}
                        onMarkRead={markRead}
                        onDismiss={dismiss}
                        onOpen={close}
                    />
                </div>
                <NotificationPagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    totalPages={totalPages}
                    isBusy={isLoading || isRefreshing || isMarkingRead}
                    hasError={hasError}
                    isMarkAllReadDisabled={unreadCount === 0 || isLoading || hasError || isMarkingRead}
                    onPageChange={setPage}
                    onMarkAllRead={() => markRead()}
                />
            </SidePanel>
        </>
    );
}
