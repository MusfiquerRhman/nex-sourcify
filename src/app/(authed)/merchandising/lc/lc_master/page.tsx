'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const MasterLC = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: lcMasterData, isLoading} = api.lcMaster.getLc.useQuery({
        limit,
        offset: page * limit,
    });

    const lcMasterList = lcMasterData?.lc ?? [];
    const total = lcMasterData?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.lcMaster.searchLc.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/merchandising/lc/lc_master/edit/';

    const deleteMutation = api.lcMaster.deleteLc.useMutation({
        onSuccess: async () => {
            toast.success('LC deleted successfully');
            await Promise.all([
                utils.lcMaster.getLc.invalidate(),
                utils.lcMaster.searchLc.invalidate(),
            ]);
        }
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'LC deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Master LC"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Master LC..."
                        infoText="Search Master LC No, Order Reference, Style or PO."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Master LC"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/lc/lc_master/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.lc && !!debouncedSearch 
                            ? searchQuery.data.lc : lcMasterList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.lc && searchQuery.data.lc.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={false}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.lc && !!debouncedSearch 
                        ? searchQuery.data.lc : lcMasterList
                ).find(lc => lc.id.toString() === deleteID)?.lc_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default MasterLC;