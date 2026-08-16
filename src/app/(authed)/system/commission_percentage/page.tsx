'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const BuyerCommissions = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: distributions, isLoading} = api.commissionPercentage.getCommissions.useQuery({ 
        limit,
        offset: page * limit,
    });
    
    // Search query (enabled only when there's a search term)
    const searchQuery = api.commissionPercentage.searchCommissions.useQuery(
        { query: debouncedSearch },
        { enabled: debouncedSearch.length > 0 }
    );
    
    const distributionsList = distributions?.distributions ?? [];
    const total = distributions?.total ?? 0;

    const editURL = '/maintenance/commission_percentage/edit/';

    const deleteMutation = api.commissionPercentage.deleteCommission.useMutation({
        onSuccess: async () => {
            toast.success("Commission Distribution deleted successfully!");
            await Promise.all([
                utils.commissionPercentage.getCommissions.invalidate(),
                utils.commissionPercentage.searchCommissions.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Commission Distribution deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Commission Percentages"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Commission Distributions"
                        infoText="Buyer Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add Commission Percentage"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/maintenance/commission_percentage/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.distributions && !!debouncedSearch 
                            ? searchQuery.data.distributions : distributionsList
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
                    searchQuery.data?.distributions && !!debouncedSearch 
                        ? searchQuery.data.distributions : distributionsList
                ).find(distributions => distributions.id === safeNumber(deleteID))?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default BuyerCommissions;