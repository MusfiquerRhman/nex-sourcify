'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const CommissionDistribution = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: commissionDistributions, isLoading} = api.commissionDistribution.getCommissionDistribution.useQuery({
        limit,
        offset: page * limit,
    });

    const commissionDistributionList = commissionDistributions?.distributions ?? [];
    const total = commissionDistributions?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.commissionDistribution.searchCommissionDistribution.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );
    
    const editURL = '/merchandising/commission_distribution/edit/';
    const printURL = `/pdf/commission_distribution/`;

    const deleteMutation = api.commissionDistribution.deleteCommissionDistribution.useMutation({
        onSuccess: async () => {
            toast.success("Commission Distribution deleted successfully!");
            await Promise.all([
                utils.commissionDistribution.getCommissionDistribution.invalidate(),
                utils.commissionDistribution.searchCommissionDistribution.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Commission Distribution deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Commission Distributions"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Commission Distributions..."
                        infoText="Buyer Name, Order Reference, Style, PO, and Plan Date."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-80">
                            <Button
                                variant="secondary"
                                label="Add New Commission Distribution"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/commission_distribution/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.distributions && !!debouncedSearch 
                            ? searchQuery.data.distributions : commissionDistributionList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.distributions && searchQuery.data.distributions.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={true}
                        printURL={printURL}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.distributions && !!debouncedSearch 
                        ? searchQuery.data.distributions : commissionDistributionList
                ).find(distribution => distribution.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default CommissionDistribution;