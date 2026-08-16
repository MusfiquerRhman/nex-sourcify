'use client';

import { Form, Heading } from "~/components";
import { useLevelForm } from "./config/useLevelForm";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import PermissionsTable from "./PermissionsTable";
import NewPermissionsTable from "./NewPermissionsTable";
import { toast } from "sonner";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import clsx from "clsx";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { safeNumber } from "~/utils/numbers";

type Permissions = {
  can_view?: boolean;
  can_add?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
};

export type NewPermissions = Required<Permissions> & {
    module_id: number;
    level_id: number;
    department_id: number;
};

export type TreeNode = {
  id: number;
  parent_module_id: number | null;
};


type RouterOutputs = inferRouterOutputs<AppRouter>;
export type GetPermissionsOutput = RouterOutputs["permissions"]["getPermissions"];
export type GetNewModulesOutput = RouterOutputs["permissions"]["getNewModules"];

const Levels = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useLevelForm();
    const [updates, setUpdates] = useState<Record<string, Permissions>>({});
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    const [isLoadingNewPermissions, setIsLoadingNewPermissions] = useState(false);
    const [newPermissions, setNewPermissions] = useState<NewPermissions[]>([]);
    const [loadPermissionsClicked, setLoadPermissionsClicked] = useState(false)
    const [permissionHash, setPermissionHash] = useState<Record<string, {
        id: number;
        module_name: string;
        parent_module_id: number | null;
    }>>({})

    const utils = api.useUtils();

    // query hook to use inside event handler
    const permissionsQuery = api.permissions.getPermissions.useQuery({
        level_id: String(methods.watch("level_id")),
        department_id: String(methods.watch("department_id")),
    },{
        enabled: false, // don’t auto-run
    });

    const newPermissionQuery = api.permissions.getNewModules.useQuery({
        level_id: String(methods.watch("level_id")),
        department_id: String(methods.watch("department_id")),
    },{
        enabled: false,
    });

    const onSubmitFetchPermissions = handleSubmit(async () => {
        setIsLoadingPermissions(true);
        try {
            // Fetch existing permissions
            await permissionsQuery.refetch();

            setLoadPermissionsClicked(true);

            // Fetch new modules as well
            await newPermissionQuery.refetch();
        }
        catch {
            toast.error('Failed to load permissions');
        }
        finally {
            setIsLoadingPermissions(false);
        }
    });

    const handlePermissionChange = (e: React.SyntheticEvent<HTMLInputElement>, id: string, key: string) => {
        const checked = e.currentTarget.checked;
        setUpdates(prev => {
            const prevRow = prev[id] ?? {};

            // If "can_view" is turned off set ALL related permissions to false
            if (key === "can_view" && !checked) {
                return {
                    ...prev,
                    [id]: {
                        can_view: false,
                        can_add: false,
                        can_update: false,
                        can_delete: false,
                    },
                };
            }

            // if "can_view" is turned off when and another permission is turned on, set "can_view" to true
            if (key !== "can_view" && !prevRow.can_view) {
                return {
                    ...prev,
                    [id]: {
                        ...prevRow,
                        [key]: checked,
                        can_view: true,
                    },
                };
            }

            // Otherwise just update the clicked field
            return {
                ...prev,
                [id]: {
                    ...prevRow,
                    [key]: checked,
                },
            };
        });
    };

    // update mutation hook to use inside event handler
    const updatePermissionsMutation = api.permissions.updatePermissions.useMutation({
        onSuccess: async () => {
            // Refetch permissions and new modules after successful update
            await Promise.all([
                permissionsQuery.refetch(),
                newPermissionQuery.refetch(),
                utils.modules.getNavItems.invalidate(),
            ]);
            toast.success("Permissions Updated Successfully");
        },
    });

    const handleUpdate = async () => {
        setIsLoadingUpdate(true);

        try {
            await updatePermissionsMutation.mutateAsync({
                permissions: updates,
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update permissions: ${message}`);
        }
        finally {
            setIsLoadingUpdate(false);
        }
    }

    const handleNewPermissionsChange = (e: React.SyntheticEvent<HTMLInputElement>, moduleId: number, key: string) => {
        const checked = e.currentTarget.checked;
        setNewPermissions(prev => {
            const existing = prev.find(p => p.module_id === moduleId);
            if (existing) {
                let updated = prev;

                // Turning OFF can_view turns ALL off
                if (key === "can_view" && !checked) {
                    updated = prev.map(p =>
                        p.module_id === moduleId
                            ? {
                                ...p,
                                can_view: false,
                                can_add: false,
                                can_update: false,
                                can_delete: false,
                            }
                            : p
                    );
                }

                // Turning can_view ON if another permission is turned on
                else if (key !== "can_view" && !existing.can_view) {
                    updated = prev.map(p =>
                        p.module_id === moduleId
                            ? {
                                ...p,
                                [key]: checked,
                                can_view: true,
                            }
                            : p
                    );
                }
                // Normal update
                else {
                    updated = prev.map(p =>
                        p.module_id === moduleId
                            ? { ...p, [key]: checked }
                            : p
                    );
                }

                // Delete entry if ALL permissions are false
                return updated.filter(p =>
                    !(
                        p.can_view === false &&
                        p.can_add === false &&
                        p.can_update === false &&
                        p.can_delete === false
                    )
                );
            }

            // New entry 
            return [
                ...prev,
                {
                    module_id: moduleId,
                    level_id: safeNumber(methods.watch("level_id")),
                    department_id: safeNumber(methods.watch("department_id")),
                    can_view: true,
                    can_add: key === "can_add" ? checked : false,
                    can_update: key === "can_update" ? checked : false,
                    can_delete: key === "can_delete" ? checked : false,
                },
            ];
        });
    };

    useEffect(() => {
        setPermissionHash(
            Object.fromEntries(
                (newPermissionQuery.data ?? []).map(item => [item.id, {
                    id: item.id,
                    module_name: item.name,
                    parent_module_id: item.parent_module_id,
                }])
            )
        );
    }, [newPermissionQuery.data]);

    const addPermissionsMutation = api.permissions.addNewPermissions.useMutation({
        onSuccess: async () => {
            await permissionsQuery.refetch();
            toast.success("New Permissions Added Successfully");

            // Refetch modules to update any permission-related data
            await utils.modules.getModules.refetch(); 

            // Clear new permissions and refetch modules
            setNewPermissions([]);
            await newPermissionQuery.refetch();

            // Invalidate nav items to reflect new permissions
            await utils.modules.getNavItems.invalidate(); 
        },
    });

    const handleSubmitNewPermissions = async () => {
        setIsLoadingNewPermissions(true);

        try {
            await addPermissionsMutation.mutateAsync(newPermissions);
            toast.success("New Permissions Added Successfully");
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add new permissions: ${message}`);
        }
        finally {
            setIsLoadingNewPermissions(false);
        }

    }

    return (
        <section className={clsx('w-full flex flex-col justify-center pb-16')}>
            <Heading>Permissions</Heading>
            <div className="flex flex-col rounded-lg emboss justify-center mt-4">
                <Form register={methods.register} 
                    onSubmit={onSubmitFetchPermissions} 
                    fields={formFields} 
                    buttonLabel="Load Permission"
                    validationError={validationError} 
                    isLoading={isLoadingPermissions}
                    control={control}
                />
            </div>
            <div className="flex flex-col rounded-lg emboss justify-center mt-8">
                <PermissionsTable 
                    permissions={loadPermissionsClicked ? permissionsQuery.data ?? null : null}
                    updates={updates}
                    handleClick={handlePermissionChange}
                    handleUpdate={handleUpdate}
                    isLoading={isLoadingUpdate}
                />
            </div>
            <div className="flex flex-col rounded-lg emboss justify-center mt-8">
                <NewPermissionsTable 
                    newPermissionsModules={newPermissionQuery.data ?? null}
                    handleNewPermissionsChange={handleNewPermissionsChange}
                    permissionHash={permissionHash}
                    newPermissions={newPermissions}
                    isLoading={isLoadingNewPermissions}
                    handleSubmitNewPermissions={handleSubmitNewPermissions}
                />
            </div>
        </section>
    )
}

export default Levels;