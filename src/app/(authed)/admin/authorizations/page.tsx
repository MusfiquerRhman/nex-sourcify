'use client';

import { Button, Loader, TableBody, TableCell, TableHead, TableHeadCells, TableRow, TableWrapper, Wrapper } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { formatDateTime } from "~/utils/localDateString";
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const AuthorizationsPage = () => {
    const { data: authorizationsData, isLoading } = api.authorizations.getAuthorizationModules.useQuery();
    const [Changes, setChanges] = useState<{id: number, level_id: number}[]>([]);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

    const utils = api.useUtils();
    
    // Has a hook, must call before conditional returns
    const tableColumns = tableHeaders();


    const handleChange = (e: ChangeEvent<HTMLSelectElement>, id: number) => {
        setChanges((prev) => {
            const existingChangeIndex = prev.findIndex(change => change.id === id);
            if (existingChangeIndex !== -1) {
                const updatedChanges = [...prev];
                updatedChanges[existingChangeIndex] = { id, level_id: parseInt(e.target.value) };
                return updatedChanges;
            } else {
                return [...prev, { id, level_id: parseInt(e.target.value) }];
            }
        });
    }

    // Update mutation for authorization levels
    const updateMutation = api.authorizations.upDateAuthorizationLevels.useMutation({
        onSuccess: async () => {
            toast.success("Authorization levels updated successfully.");
            await utils.authorizations.getAuthorizationModules.invalidate();
            setChanges([]);
        },
        onError: () => {
            setIsLoadingUpdate(false);
        }
    });

    const handleUpdate = async () => {
        setIsLoadingUpdate(true);
        try{
            await updateMutation.mutateAsync({ changes: Changes });
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating authorization levels: ${message}`);
        } finally {
            setIsLoadingUpdate(false);
        }
    }
    
    if (isLoading) return <Loader />;


    return (
        <Wrapper heading="Authorization" >
            <TableWrapper>
                <TableHead>
                    <tr>
                        {tableColumns.map((col, index) => (
                            <TableHeadCells key={index}>
                                {col.label}
                            </TableHeadCells>
                        ))}
                    </tr>
                </TableHead>
                <TableBody>
                    {authorizationsData?.map((item, index) => (
                        <TableRow key={index}>
                            {tableColumns.map((col, index) => (
                                <TableCell key={index}>
                                    {(() => {
                                        switch ((col.type ?? '').toLowerCase()) {
                                            case 'date':
                                                return <p>{formatDateTime(item[col.key as keyof typeof item] as string)}</p>;
                                            
                                            case 'select':
                                                return (
                                                    <select defaultValue={item[col.key as keyof typeof item] as string}
                                                        onChange={(e) => handleChange(e, item.id)}
                                                        className="w-full p-1"
                                                    >
                                                        {col.options?.map((opt, index) => (
                                                            <option key={index} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                )

                                            default:
                                                return (
                                                    <p>{item[col.key as keyof typeof item] as string}</p>
                                                )
                                        }
                                    })()}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </TableWrapper>
            <div className="m-4 flex justify-end">
                <Button variant="primary" 
                    onClick={handleUpdate} 
                    label="Save Changes"
                    disabled={Changes.length === 0 || isLoadingUpdate}
                    className="max-w-80"
                />
            </div>
        </Wrapper>
    );
}

export default AuthorizationsPage;