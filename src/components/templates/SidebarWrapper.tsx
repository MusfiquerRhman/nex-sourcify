"use client";
import { api } from "~/trpc/react";

import { SideBar, Loader } from '~/components'
import React, { useEffect } from "react";
import sideBarConfig from "../../utils/url.config";
import { useDecodedUser } from "~/hooks/useDecodedUser";
import { useNavigationStore, usePermissionStore } from "~/store";
import { skipToken } from "@tanstack/react-query";

// SidebarWrapper component to fetch navigation data and render SideBar
const SideBarWrapper = ({children}: {children: React.ReactNode}) => {
    // Fetch paginated data
    const {data: modules, isLoading} = api.modules.getNavItems.useQuery();

    const load = useNavigationStore((s) => s.load);

    const { user } = useDecodedUser();

    const permissionsQuery = api.permissions.getPermissions.useQuery(!!user ? {
        level_id: user?.level_id.toString() ?? "",
        department_id: user?.department_id.toString() ?? "",
    } : skipToken);

    const permissions = permissionsQuery.data;
    const addPermission = usePermissionStore((s) => s.addPermission);

    // store permissions in zustand
    // React Query is too dynamic + async for permission checks.
    // but we need No waiting, No async, Just cheap JS object lookups for fast access
    useEffect(() => {
		if (permissions && Array.isArray(permissions)) {
			permissions.forEach((p) => addPermission(p));
		}
    }, [permissions, addPermission]);

    useEffect(() => {
      	load(sideBarConfig);
    }, []);

    if (isLoading) {
        return <Loader />;
    }
    
    return <SideBar navData={modules ?? []}> {children}</SideBar>
}

export default React.memo(SideBarWrapper) as typeof SideBarWrapper;