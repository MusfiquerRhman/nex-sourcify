'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const BuyerWiseTNAActions = () => {
    const router = useRouter();
    const utils = api.useUtils();
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: tnaBaseActions, isLoading} = api.tnaBaseAction.getAllTnaBaseActions.useQuery({
        limit,
        offset: page * limit,
    });

    const tnaBaseActionsList = tnaBaseActions?.tnaBaseActions ?? [];
    const total = tnaBaseActions?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.tnaBaseAction.searchTnaBaseActions.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );
    
    const editURL = '/maintenance/tna_base_action/edit/';

    const deleteMutation = api.tnaBaseAction.deleteTnaBaseAction.useMutation({
        onSuccess: async () => {
            toast.success("TNA Base Action deleted successfully!");
            await Promise.all([
                utils.tnaBaseAction.getAllTnaBaseActions.invalidate(),
                utils.tnaBaseAction.searchTnaBaseActions.invalidate(),
            ]);
        },
    });
    
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Base TNA Action deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Base TNA Actions"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Base TNA Actions..."
                        infoText="Buyer name and TNA Action name"
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
                                onClick={() => router.push('/maintenance/tna_base_action/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.tnaBaseActions && !!debouncedSearch 
                            ? searchQuery.data.tnaBaseActions : tnaBaseActionsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.tnaBaseActions && searchQuery.data.tnaBaseActions.length > 0 
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
                description={`Are you sure you want to delete Base TNA Action for buyer"${(
                    searchQuery.data?.tnaBaseActions && !!debouncedSearch 
                        ? searchQuery.data.tnaBaseActions : tnaBaseActionsList
                ).find(action => action.id === deleteID)?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
}

export default BuyerWiseTNAActions;