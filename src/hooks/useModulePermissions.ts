import { useModulePath } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";

export const useModulePermissions = () => {
    const modulePath = useModulePath().path;

    const pathId = useNavigationStore(s => s.getByHref(modulePath));

    const permissions = usePermissionStore(s => pathId ? s.permission[pathId] : undefined);

    return {
        modulePath,
        permissions,
        can_view: permissions?.can_view,
        can_add: permissions?.can_add,
        can_update: permissions?.can_update,
        can_delete: permissions?.can_delete,
    };
};