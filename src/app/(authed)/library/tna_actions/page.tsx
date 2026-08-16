'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const TnaActionsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: tnaActions, isLoading} = api.tnaActions.getTnaActions.useQuery({
        limit,
        offset: page * limit,
    });

    const tnaActionsList = tnaActions?.tnaActions ?? [];
    const total = tnaActions?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.tnaActions.searchTnaActions.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/tna_actions/edit/';

    const deleteMutation = api.tnaActions.deleteTnaAction.useMutation({
        onSuccess: async () => {
            toast.success("TNA Action deleted successfully!");
            await Promise.all([
                utils.tnaActions.getTnaActions.invalidate(),
                utils.tnaActions.searchTnaActions.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'TNA Action deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="TNA Actions"
                subSectionLeft={
                    <SearchField
                        placeholder="Search TNA Actions..."
                        infoText="Action Name, Description, Lead Time and Alert before."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New TNA Action"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/tna_actions/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.tnaActions && !!debouncedSearch 
                            ? searchQuery.data.tnaActions : tnaActionsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.tnaActions && searchQuery.data.tnaActions.length > 0 
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
                    searchQuery.data?.tnaActions && !!debouncedSearch 
                        ? searchQuery.data.tnaActions : tnaActionsList
                ).find(action => action.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};
          
export default TnaActionsPage;