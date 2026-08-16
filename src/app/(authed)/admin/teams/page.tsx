'use client';
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { parseTRPCError } from "~/utils/parseTRPCError";

const TeamsPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Flow States
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState<number>(0);

    const utils = api.useUtils();

    // Debounced search term
    const debouncedSearch = useDebouncedValue(searchTerm);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_add, can_update, can_delete } = permissions ?? {};


    // Frontend pagination state and handlers
    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    // Fetch paginated data
    const {data: teams, isLoading} = api.teams.getTeams.useQuery({
        limit,
        offset: page * limit,
    });

    const teamsList = teams?.teams ?? [];
    const total = teams?.totalTeams ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.teams.searchTeams.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/admin/teams/edit/';

    // Delete mutation
    const deleteMutation = api.teams.deleteTeam.useMutation({
        onSuccess: async () => {
            toast.success("Team deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.teams.getTeams.invalidate(),
                utils.teams.searchTeams.invalidate()
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

        if(!deleteID) return;

        try {
            await deleteMutation.mutateAsync({ id: deleteID });
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error deleting team: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper heading="Teams"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Teams..."
                        infoText="Team Name, Buyer Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Team"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/admin/teams/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.teams && !!debouncedSearch 
                            ? searchQuery.data.teams : teamsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.teams && searchQuery.data.teams.length > 0 
                                ? searchQuery.data.total ?? 0 : total
                            }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "
                    ${teamsList.find(team => team.id === deleteID)?.team_name}"?`
                }
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default TeamsPage;