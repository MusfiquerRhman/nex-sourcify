'use client';
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { useDebouncedValue, useModulePermissions, useTablePagination } from "~/hooks";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { parseTRPCError } from "~/utils/parseTRPCError";

const EvPermissionsPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Flow States
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState<number>(0);
        
    const utils = api.useUtils();
    
    const debouncedSearch = useDebouncedValue(searchTerm);

    const { can_add, can_update, can_delete } = useModulePermissions();
    
    // Frontend pagination state and handlers
    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();


    // Fetch paginated data
    const { data: evPermissions, isLoading } = api.evPermissions.getAllEvPermissions.useQuery({
        limit,
        offset: page * limit,
    });

    const evPermissionsList = evPermissions?.evPermissions ?? [];
    const total = evPermissions?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.evPermissions.searchEvPermissions.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/admin/ev_permissions/edit/';

    const deleteMutation = api.evPermissions.deleteEvPermission.useMutation({
        onSuccess: async () => {
            toast.success("EV Permission deleted successfully!");
            setDeleteClicked(false);
            await Promise.all([
                utils.evPermissions.getAllEvPermissions.invalidate(),
                utils.evPermissions.searchEvPermissions.invalidate()
            ]);
        }
    });

    // Handlers
    const handleDeleteClicked = useCallback((id: string) => {
        setDeleteClicked(true);
        setDeleteID(parseInt(id));
    }, []);
        
    const handleDeleteConfirmed = useCallback(async () => {
        setIsLoadingDelete(true);

        if (!deleteID) return;

        try {
            await deleteMutation.mutateAsync({ id: deleteID });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting EV Permission: ${message}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);
    

    return (
        <>
            <Wrapper
                heading="Excess Value Permissions"
                subSectionLeft={
                    <SearchField
                        placeholder="Search EV Permissions..."
                        infoText="EV Permission."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New EV Permission"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/admin/ev_permissions/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.evPermissions && !!debouncedSearch 
                            ? searchQuery.data.evPermissions : evPermissionsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.evPermissions && searchQuery.data.evPermissions.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={can_update ? editURL : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.evPermissions && !!debouncedSearch 
                        ? searchQuery.data.evPermissions : evPermissionsList
                ).find(evPermission => evPermission.id === deleteID)?.user_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default EvPermissionsPage;