'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const LCAmendment = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();


    const {data: salesContractAmendments, isLoading} = api.lcAmendment.getLcAmendments.useQuery({
        limit,
        offset: page * limit,
    });

    const salesContractAmendmentsList = salesContractAmendments?.lc ?? [];
    const total = salesContractAmendments?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.lcAmendment.searchLcAmendments.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/merchandising/lc/lc_amendments/edit/';

    const deleteMutation = api.lcAmendment.deleteLcAmendment.useMutation({
        onSuccess: () => {
            toast.success('LC Amendment deleted successfully');
            utils.lcAmendment.getLcAmendments.invalidate();
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'LC Amendment deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="LC Amendments"
                subSectionLeft={
                    <SearchField
                        placeholder="Search LC Amendments..."
                        infoText="Search LC No, Factory Name, Order Reference, Style or PO."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Amendment"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/lc/lc_amendments/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.lc && !!debouncedSearch 
                            ? searchQuery.data.lc : salesContractAmendmentsList
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
                        ? searchQuery.data.lc : salesContractAmendmentsList
                ).find(contract => contract.id.toString() === deleteID)?.lc_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default LCAmendment;