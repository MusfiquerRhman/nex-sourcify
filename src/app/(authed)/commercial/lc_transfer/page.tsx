'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const LcTransferPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();
    
    const {data: lcTransfers, isLoading} = api.lcTransfer.getLcTransferList.useQuery({
        limit,
        offset: page * limit,
    });

    const lcTransfersList = lcTransfers?.lcTransfers ?? [];
    const total = lcTransfers?.total ?? 0;
    

    // Search query (enabled only when there's a search term)
    const searchQuery = api.lcTransfer.searchLcTransfers.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/commercial/lc_transfer/edit/';

    const deleteMutation = api.lcTransfer.deleteLcTransfer.useMutation({
        onSuccess: async () => {
            toast.success("LC Transfer deleted successfully!");
            await Promise.all([
                utils.lcTransfer.getLcTransferList.invalidate(),
                utils.lcTransfer.searchLcTransfers.invalidate(),
            ]);
        }
    });

    // Handlers
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'LC Transfer deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="LC Transfers"
                subSectionLeft={
                    <SearchField
                        placeholder="Search LC Transfers..."
                        infoText="LC No, Buyer Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New LC Transfer"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/commercial/lc_transfer/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.lcTransfers && !!debouncedSearch 
                            ? searchQuery.data.lcTransfers : lcTransfersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.lcTransfers && searchQuery.data.lcTransfers.length > 0 
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
                    searchQuery.data?.lcTransfers && !!debouncedSearch 
                        ? searchQuery.data.lcTransfers : lcTransfersList
                ).find((lcTransfer) => lcTransfer.DB_ID === deleteID)?.LC_NO}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default LcTransferPage;