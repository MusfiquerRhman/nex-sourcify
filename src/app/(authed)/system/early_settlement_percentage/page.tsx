'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const DestinationsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: earlySettlement, isLoading} = api.earlySettlementPercentage.getEarlySettlementPercentage.useQuery({
        limit,
        offset: page * limit,
    });

    const earlySettlementList = earlySettlement?.charges ?? [];
    const total = earlySettlement?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.earlySettlementPercentage.searchEarlySettlementPercentages.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/system/early_settlement_percentage/edit/';

    const deleteMutation = api.earlySettlementPercentage.deleteEarlySettlement.useMutation({
        onSuccess: async () => {
            toast.success("Destination deleted successfully!");
            await Promise.all([
                utils.earlySettlementPercentage.getEarlySettlementPercentage.invalidate(),
                utils.earlySettlementPercentage.searchEarlySettlementPercentages.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Destination deleted successfully',
        payloadBuilder: id => ({ id: id }),
    });

    return (
        <>
            <Wrapper
                heading="Early Settlement Charge"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Early Settlement..."
                        infoText="Buyer Name"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div>
                            <Button
                                variant="secondary"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/system/early_settlement_percentage/new')}
                                label="Add Early Settlement"
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.charges && !!debouncedSearch 
                            ? searchQuery.data.charges : earlySettlementList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.charges && searchQuery.data.charges.length > 0 
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
                    searchQuery.data?.charges && !!debouncedSearch 
                        ? searchQuery.data.charges : earlySettlementList
                ).find(earlySettlements => earlySettlements.id === safeNumber(deleteID))?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
}

export default DestinationsPage;