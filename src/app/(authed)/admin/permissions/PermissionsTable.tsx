import { Button, CheckBox, Heading, Info, Loader, TableBody, TableCell, TableHead, TableHeadCells, TableRow, TableWrapper } from "~/components";
import { permissionTableHeaders } from "./config/columns";
import type { SyntheticEvent } from "react";
import type { GetPermissionsOutput } from './page';

interface PermissionsProps {
    permissions: GetPermissionsOutput | null,
    updates: Record<string, Record<string, boolean>>,
    handleClick: (e: SyntheticEvent<HTMLInputElement, Event>, id: string, key: string) => void,
    handleUpdate: () => Promise<void>,
    isLoading?: boolean,
};

const PermissionsTable = (props: PermissionsProps) => {
    const { permissions, updates, handleClick, handleUpdate, isLoading } = props;

    if(!permissions) return null;

    if (isLoading) return <Loader />;

    return (
        <div>
            {permissions.length === 0 ? (
                <Info info="No permissions found for the selected level and department." 
                    className="w-full text-center p-4"
                />
            ) : (
                <>
                    <Heading as='h2' className="m-2">
                        Existing Permissions
                    </Heading>
                    <TableWrapper>
                        <TableHead>
                            <tr>
                                {permissionTableHeaders.map((col, index) => (
                                    <TableHeadCells key={index}>
                                        {col.label}
                                    </TableHeadCells>
                                ))}
                            </tr>
                        </TableHead>
                        <TableBody>
                            {permissions?.map((row, index) => (
                                <TableRow key={index}>
                                    {permissionTableHeaders.map((col, index) => (
                                        <TableCell key={index}>
                                            {col.type === 'checkbox' ? (
                                                <CheckBox 
                                                    checked={updates[row.id]?.[col.key] ?? Boolean(row[col.key as keyof typeof row])}
                                                    onClick={(e) => handleClick(e, row.id, col.key)}
                                                    id={row.id}
                                                    disabled={ // Disable checkboxes for Reports and Maintenance module except for 'View' permission
                                                        row?.parent_module_name === 'Reports' && (
                                                            col.key === 'can_add'
                                                            || col.key === 'can_update'
                                                            || col.key === 'can_delete'
                                                        )
                                                        || row?.parent_module_name === 'Maintenance' && (
                                                            col.key === 'can_add'
                                                            || col.key === 'can_update'
                                                            || col.key === 'can_delete'
                                                        )
                                                    }
                                                />
                                            ) : (
                                                (() => {
                                                    const value = row[col.key as keyof typeof row];
                                                    return typeof value === 'string' 
                                                        || typeof value === 'number' 
                                                        || typeof value === 'boolean' 
                                                            ? String(value) 
                                                            : (value ? JSON.stringify(value) : "-");
                                                })()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </TableWrapper>
                    <div className="flex justify-end">
                        <Button label="Save Updates" 
                            onClick={handleUpdate} 
                            disabled={Object.keys(updates).length === 0 || isLoading}
                            className="text-lg tracking-wide mt-6 max-w-80 my-4 mx-8"
                        />
                    </div>
                </>
            )}
        </div>
    )
}

export default PermissionsTable;