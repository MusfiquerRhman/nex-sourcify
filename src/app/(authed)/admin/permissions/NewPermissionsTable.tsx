import { Button, CheckBox, Heading, Info, TableBody, TableCell, TableHead, TableHeadCells, TableRow, TableWrapper } from "~/components";
import type {GetNewModulesOutput, TreeNode, NewPermissions} from './page';
import { addPermissionTableHeaders } from "./config/columns";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { downBlackIcon, upBlackIcon } from "~/assets";
import Image from "next/image";
import { safeNumber } from "~/utils/numbers";

interface NewPermissionsProps {
    newPermissionsModules: GetNewModulesOutput | null;
    handleNewPermissionsChange: (
        e: React.SyntheticEvent<HTMLInputElement>, 
        moduleId: number, 
        key: string
    ) => void;
    permissionHash: Record<string, {
        id: number;
        module_name: string;
        parent_module_id: number | null;
    }>;
    newPermissions: NewPermissions[];
    isLoading?: boolean;
    handleSubmitNewPermissions?: () => Promise<void>;
};

// Find the root of any node in the tree by traversing up until parent_module_id is null
const findTreeRootId = (nodes: TreeNode[], startId: number): number => {
  const map = new Map(nodes.map(n => [n.id, n]));
  let current = map.get(startId)!;

  while (current.parent_module_id !== null) {
    current = map.get(current.parent_module_id)!;
  }

  return current.id;
}

// Build Tree structure: [{rootId: [all descendant ids]}, ...]
const buildTreeGroups = (nodes: TreeNode[]) => {
  const groups = new Map<number, number[]>();

  for (const node of nodes) {
    const rootId = findTreeRootId(nodes, node.id);

    if (!groups.has(rootId)) {
      groups.set(rootId, []);
    }

    if (node.id !== rootId) {
      groups.get(rootId)!.push(node.id);
    }
  }

  // convert Map to array of objects
  return Array.from(groups.entries()).map(([rootId, childIds]) => ({
    [rootId]: childIds
  }));
}

const NewPermissionsTable = (props: NewPermissionsProps) => {
    const { newPermissionsModules, handleNewPermissionsChange, permissionHash, newPermissions, isLoading, handleSubmitNewPermissions } = props;

    const [isOpen, setIsOpen] = useState<Record<number, boolean>>({});

    const count = newPermissionsModules?.reduce((acc, module) => {
        return module.parent_module_id !== null ? acc + 1 : acc;;
    }, 0);

    if (!newPermissionsModules || count === 0) return null;

    // Build tree groups for rendering each module as different table
    const rootMap = buildTreeGroups(newPermissionsModules.map(m => ({
        id: m.id,
        parent_module_id: m.parent_module_id,
    })));

    return (
        <div>
            {newPermissionsModules.length === 0 ? (
                <Info info="No new modules found for the selected level and department." 
                    className="w-full text-center p-4"
                />
            ) : (
                <>
                    <Heading as='h2' className="m-2">
                        Add New Permissions
                    </Heading>
                    {rootMap.map((group, index) => (
                        <React.Fragment key={index}>
                            {Object.entries(group).map(([rootId, childIds]) => (
                                childIds.length > 0 && (
                                    <React.Fragment key={rootId}>
                                        <div onClick={() => setIsOpen((prev) => ({ ...prev, [safeNumber(rootId)]: !prev[safeNumber(rootId)] }))}
                                            className="w-[calc(100% - 8px)] bg-gray-light hover:bg-secondary-light mb-2 px-4 py-2 font-semibold flex flex-row gap-4 items-center cursor-pointer"
                                        >
                                            {
                                                isOpen[safeNumber(rootId)] 
                                                    ? <Image width={20} height={20} alt="up icon" src={upBlackIcon.src} className="h-4"/> 
                                                    : <Image width={20} height={20} alt="down icon" src={downBlackIcon.src} className="h-4"/>
                                            } 
                                            {permissionHash[safeNumber(rootId)]?.module_name}
                                        </div>
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={isOpen[safeNumber(rootId)] ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        > 
                                            <TableWrapper className="mb-4">
                                                <TableHead>
                                                    <tr>
                                                        {addPermissionTableHeaders.map((col, index) => (
                                                            <TableHeadCells key={index}>
                                                                {col.label}
                                                            </TableHeadCells>
                                                        ))}
                                                    </tr>
                                                </TableHead>
                                                <TableBody key={rootId}>
                                                    {childIds.map((id) => (
                                                        <TableRow key={id}>
                                                            {addPermissionTableHeaders.map((col, index) => (
                                                                <TableCell key={index}>
                                                                    {col.type === 'checkbox' ? (
                                                                        <CheckBox
                                                                            checked={!!newPermissions.find(item => item.module_id === id)?.[col.key as keyof NewPermissions]}
                                                                            onClick={(e) => handleNewPermissionsChange(e, id, col.key)}
                                                                            disabled={ // Disable checkboxes for Reports module except for 'View' permission
                                                                                permissionHash[safeNumber(rootId)]?.module_name === 'Reports' && (
                                                                                    col.key === 'can_add'
                                                                                    || col.key === 'can_update'
                                                                                    || col.key === 'can_delete'
                                                                                )
                                                                                || permissionHash[safeNumber(rootId)]?.module_name === 'Maintenance' && (
                                                                                    col.key === 'can_add'
                                                                                    || col.key === 'can_update'
                                                                                    || col.key === 'can_delete'
                                                                                )
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        String(permissionHash[id]?.[col.key as keyof typeof permissionHash[number]] ?? "-")
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </TableWrapper>
                                        </motion.div>
                                    </React.Fragment>
                                )
                            ))}
                        </React.Fragment>
                    ))}
                    <div className="w-full flex justify-end">
                        <Button 
                            disabled={newPermissions.length === 0 || isLoading}
                            className="my-4 mx-8 max-w-80"
                            label="Add New Permissions"
                            onClick={handleSubmitNewPermissions}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

export default NewPermissionsTable;
